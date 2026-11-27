/* eslint-disable react-hooks/immutability -- the expo-video player is configured by mutating it, by design */
import { useEventListener } from 'expo';
import { useVideoPlayer, type VideoPlayer } from 'expo-video';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Dimensions, Platform } from 'react-native';

import { useAsync } from '@/hooks/use-async';
import { recordStart, resumeAt, savePosition } from '@/services/history';
import {
  getQualityMode,
  maxResolutionFor,
  prepareSource,
  useQualityMode,
  type QualityMode,
  type ScreenSize,
} from '@/services/playback';
import {
  isStreamStale,
  loadVideo,
  resolveStream,
  type LoadedVideo,
  type PlaybackErrorCode,
  type Stream,
  type VideoError,
  type VideoSummary,
} from '@/services/youtube';

import { isRealEnd, isSaveDue, playbackError, recoveryAfter, streamFailureOutcome, type Recovery } from './helpers';

export type WatchStatus =
  | { state: 'loading' }
  /** The Video is loaded into the player (playing, paused or buffering). */
  | { state: 'ready' }
  /** Playback reached the end: offer the Up Next. */
  | { state: 'ended' }
  | { state: 'error'; error: VideoError };

export type WatchSession = {
  player: VideoPlayer;
  status: WatchStatus;
  video: VideoSummary | null;
  related: VideoSummary[];
  /** The first Related Video, offered when the Video ends; null when there are none. */
  upNext: VideoSummary | null;
  qualityMode: QualityMode;
  setQualityMode: (mode: QualityMode) => void;
  retry: () => void;
};

/** The screen as `maxResolutionFor` / `prepareSource` expect it: points plus pixel ratio. */
function screenSize(): ScreenSize {
  const { width, height, scale } = Dimensions.get('screen');
  return { width, height, scale };
}

/**
 * One Watch page's playback: loads the Video, plays it from `startAt ?? resumeAt(videoId)`,
 * keeps History and the Resume Position current, and applies the Quality Mode.
 * The player is released when the page unmounts, which stops playback.
 *
 * Stream resilience: a rejected Stream (403) is re-resolved once and continues at the same position;
 * a second rejection before playback has moved past that point is shown. A stale Stream is replaced
 * when the app returns to the foreground, and when playback starts or resumes. The native controls
 * start playing before any JS runs, so a stale Stream can play for a moment before it is paused and swapped.
 */
export function useWatchSession(videoId: string, startAt?: number): WatchSession {
  const [qualityMode, setQualityMode] = useQualityMode();
  const load = useAsync(`watch:${videoId}`, () => loadVideo(videoId));
  const data = load.status === 'success' ? load.data : null;

  const player = useVideoPlayer(null, (p) => {
    p.staysActiveInBackground = true;
    p.showNowPlayingNotification = true;
    p.timeUpdateEventInterval = 1;
    p.maxResolution = maxResolutionFor(getQualityMode(), screenSize());
  });

  // Keyed by the load they belong to, so a retry starts clean without resetting state in an effect.
  const [ended, setEnded] = useState<LoadedVideo | null>(null);
  const [failure, setFailure] = useState<{ for: LoadedVideo; error: VideoError } | null>(null);

  /** Mutable per-page playback bookkeeping that must not re-render. */
  const session = useRef({
    /** The load being played; failures are shown for it. */
    load: null as LoadedVideo | null,
    video: null as VideoSummary | null,
    /** The Stream and Quality Mode currently loaded into the player. */
    loaded: null as { stream: Stream; mode: QualityMode } | null,
    started: false,
    lastSaved: null as number | null,
    /** The Video's position. Not updated while a source swap is in flight. */
    position: 0,
    duration: 0,
    /** A forced re-resolve playback has not moved past yet; another rejection before then is shown. */
    recovery: null as Recovery,
    /** Source swaps in flight. Meanwhile the player's time and errors belong to no settled source. */
    swapping: 0,
    /** A player error that arrived during a swap, reported if the player is still in error once it settles. */
    errorDuringSwap: null as string | null,
    /** A re-resolve is in flight; further triggers wait for it. */
    reResolving: false,
  });

  const save = useCallback((position: number) => {
    const s = session.current;
    if (!s.video || !s.started) return;
    savePosition(s.video.id, position, s.duration || s.video.durationSeconds);
    s.lastSaved = position;
  }, []);

  /** Shows `error` for the current load. */
  const fail = useCallback((error: unknown, code: PlaybackErrorCode) => {
    const current = session.current.load;
    if (current) setFailure({ for: current, error: playbackError(error, code) });
  }, []);

  /**
   * Loads `stream` with the current Quality Mode's source at `at` seconds, then plays if `play`.
   * On iOS, a Quality Mode change during the swap reloads with the new mode before seeking.
   * Throws when the source cannot be prepared, or when the player is in error once the swap settles.
   */
  const applySource = useCallback(
    async (video: VideoSummary, stream: Stream, at: number, play: boolean) => {
      const s = session.current;
      s.swapping += 1;
      s.errorDuringSwap = null;
      try {
        let mode: QualityMode;
        do {
          mode = getQualityMode();
          const screen = screenSize();
          player.maxResolution = maxResolutionFor(mode, screen);
          const { uri } = await prepareSource(stream, mode, screen);
          await player.replaceAsync({
            uri,
            contentType: 'hls',
            metadata: { title: video.title, artist: video.channel, artwork: video.thumbnailUrl },
          });
          s.loaded = { stream, mode };
        } while (Platform.OS === 'ios' && getQualityMode() !== mode);
        if (player.status === 'error') throw new Error(s.errorDuringSwap ?? 'player error during source swap');
        player.currentTime = at;
        s.position = at;
        if (play) player.play();
      } finally {
        s.swapping -= 1;
      }
    },
    [player],
  );

  /** The loaded Stream, or a freshly resolved one when it is close to expiring. */
  const freshStream = useCallback(async (video: VideoSummary, stream: Stream) => {
    if (!isStreamStale(stream, Date.now())) return stream;
    return resolveStream(video.id);
  }, []);

  /**
   * Resolves a new Stream and reloads it at the current position.
   * `force` re-resolves even a fresh Stream (after a rejection) and counts as the one re-resolve
   * allowed until playback moves past it; otherwise only a stale Stream is replaced.
   */
  const reResolve = useCallback(
    async (force: boolean, play: boolean) => {
      const s = session.current;
      const { video, loaded } = s;
      if (!video || s.reResolving) return;
      if (!force && (!loaded || !isStreamStale(loaded.stream, Date.now()))) return;
      if (force) s.recovery = { restoredAt: s.position };
      s.reResolving = true;
      try {
        const stream = await resolveStream(video.id);
        // The page may have moved on to another Video meanwhile.
        if (session.current.video !== video) return;
        await applySource(video, stream, s.position, play);
      } finally {
        s.reResolving = false;
      }
    },
    [applySource],
  );

  /** A playback failure: a rejected Stream is re-resolved once, anything else is shown. */
  const streamFailed = useCallback(
    (error: unknown, code: PlaybackErrorCode) => {
      const outcome = streamFailureOutcome(error, session.current.recovery, code);
      if ('error' in outcome) {
        fail(outcome.error, code);
        return;
      }
      reResolve(true, true).catch((e: unknown) => fail(e, 'reresolve'));
    },
    [fail, reResolve],
  );

  // A (re)loaded Video: start it at `startAt` (a Video Link's `t=`), or else its Resume Position.
  useEffect(() => {
    if (!data) return;
    let live = true;
    const s = session.current;
    const at = startAt ?? resumeAt(data.video.id);
    s.load = data;
    s.video = data.video;
    s.duration = data.video.durationSeconds;
    s.loaded = null;
    s.recovery = null;
    s.position = at;
    applySource(data.video, data.stream, at, true).catch((error: unknown) => live && streamFailed(error, 'source'));
    return () => {
      live = false;
    };
  }, [data, startAt, applySource, streamFailed]);

  // Quality Mode changes keep the position. Android switches live via `maxResolution`;
  // iOS only treats it as a hint, so the rewritten source is reloaded at the current position.
  // A change while a swap is in flight is picked up by that swap.
  useEffect(() => {
    const s = session.current;
    player.maxResolution = maxResolutionFor(qualityMode, screenSize());
    if (Platform.OS !== 'ios' || !s.video || !s.loaded || s.swapping || s.loaded.mode === qualityMode) return;
    const { video, loaded } = s;
    const playing = player.playing;
    freshStream(video, loaded.stream)
      .then((stream) => applySource(video, stream, s.position, playing))
      .catch((error: unknown) => streamFailed(error, 'quality'));
  }, [qualityMode, player, applySource, freshStream, streamFailed]);

  useEventListener(player, 'playingChange', ({ isPlaying }) => {
    const s = session.current;
    if (!isPlaying) {
      // Mid-swap the player can report 0 before the seek; the known position is the real one.
      save(s.swapping ? s.position : player.currentTime);
      return;
    }
    setEnded(null);
    if (!s.started && s.video) {
      recordStart(s.video);
      s.started = true;
    }
    // Playing or resuming a Stream that is about to expire: stop it and swap it before YouTube rejects it.
    if (!s.swapping && !s.reResolving && s.loaded && isStreamStale(s.loaded.stream, Date.now())) {
      player.pause();
      reResolve(false, true).catch((error: unknown) => streamFailed(error, 'resume'));
    }
  });

  useEventListener(player, 'timeUpdate', ({ currentTime }) => {
    const s = session.current;
    if (s.swapping) return;
    s.position = currentTime;
    s.recovery = recoveryAfter(s.recovery, currentTime);
    if (player.duration > 0) s.duration = player.duration;
    if (isSaveDue(s.lastSaved, currentTime)) save(currentTime);
  });

  useEventListener(player, 'playToEnd', () => {
    if (!data || !isRealEnd(player.currentTime, player.duration)) return;
    save(session.current.duration);
    setEnded(data);
  });

  useEventListener(player, 'statusChange', ({ status, error }) => {
    if (status !== 'error') return;
    const s = session.current;
    const message = error?.message ?? '';
    // Mid-swap the error may belong to the outgoing source; the swap checks once it settles.
    if (s.swapping || s.reResolving) {
      s.errorDuringSwap = message;
      return;
    }
    streamFailed(message, 'player');
  });

  // Save when the app goes to the background, and when the page is left.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'background') save(session.current.position);
      // Back in the foreground: a Stream that went stale meanwhile is replaced at the same position.
      if (state === 'active') {
        reResolve(false, player.playing).catch((error: unknown) => streamFailed(error, 'foreground'));
      }
    });
    const s = session.current;
    return () => {
      subscription.remove();
      save(s.position);
    };
  }, [save, reResolve, streamFailed, player]);

  const status: WatchStatus =
    load.status === 'loading'
      ? { state: 'loading' }
      : load.status === 'error'
        ? { state: 'error', error: playbackError(load.error, 'load') }
        : failure?.for === data
          ? { state: 'error', error: failure.error }
          : ended === data
            ? { state: 'ended' }
            : { state: 'ready' };

  // Any failure stops the player, so no stale audio (e.g. a previous Video's) plays behind the error.
  const failed = status.state === 'error';
  useEffect(() => {
    if (failed) player.pause();
  }, [failed, player]);

  const related = data?.related ?? [];
  return {
    player,
    status,
    video: data?.video ?? null,
    related,
    upNext: related[0] ?? null,
    qualityMode,
    setQualityMode,
    retry: load.retry,
  };
}
