/* eslint-disable react-hooks/immutability -- the expo-video player is configured by mutating it, by design */
import { useEventListener } from 'expo';
import { useVideoPlayer, type VideoPlayer } from 'expo-video';
import { useCallback, useEffect, useEffectEvent, useRef, useState } from 'react';
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
  VideoError,
  type LoadedVideo,
  type Stream,
  type VideoSummary,
} from '@/services/youtube';

import { isRealEnd, isSaveDue, playerErrorOutcome, startPosition } from './helpers';

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

const asVideoError = (error: unknown, code: string) =>
  error instanceof VideoError ? error : new VideoError('failed', { code, cause: error });

/**
 * One Watch page's playback: loads the Video, plays it from `startAt ?? resumeAt(videoId)`,
 * keeps History and the Resume Position current, and applies the Quality Mode.
 * The player is released when the page unmounts, which stops playback.
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
    video: null as VideoSummary | null,
    /** The Stream and Quality Mode currently loaded into the player. */
    loaded: null as { stream: Stream; mode: QualityMode } | null,
    started: false,
    lastSaved: null as number | null,
    position: 0,
    duration: 0,
    /** A 403 already triggered a re-resolve since playback last ran; a second one is shown. */
    reResolvedInARow: false,
    /** A re-resolve is in flight; further triggers wait for it. */
    reResolving: false,
  });

  const save = useCallback((position: number) => {
    const s = session.current;
    if (!s.video || !s.started) return;
    savePosition(s.video.id, position, s.duration || s.video.durationSeconds);
    s.lastSaved = position;
  }, []);

  /** Loads `stream` with the Quality Mode's source at `at` seconds; plays if `autoplay`. */
  const applySource = useCallback(
    async (video: VideoSummary, stream: Stream, mode: QualityMode, at: number, autoplay: boolean) => {
      const screen = screenSize();
      player.maxResolution = maxResolutionFor(mode, screen);
      const { uri } = await prepareSource(stream, mode, screen);
      await player.replaceAsync({
        uri,
        contentType: 'hls',
        metadata: { title: video.title, artist: video.channel, artwork: video.thumbnailUrl },
      });
      session.current.loaded = { stream, mode };
      player.currentTime = at;
      session.current.position = at;
      if (autoplay) player.play();
    },
    [player],
  );

  /** The loaded Stream, or a freshly resolved one when it is close to expiring. */
  const freshStream = useCallback(async (video: VideoSummary, stream: Stream) => {
    if (!isStreamStale(stream, Date.now())) return stream;
    return resolveStream(video.id);
  }, []);

  /**
   * Resolves a new Stream and reloads it at the current position, keeping the Quality Mode.
   * `force` re-resolves even a fresh Stream (after a 403); otherwise only a stale one is replaced.
   */
  const reResolve = useCallback(
    async (force: boolean, autoplay: boolean) => {
      const s = session.current;
      const { video, loaded } = s;
      if (!video || !loaded || s.reResolving) return;
      if (!force && !isStreamStale(loaded.stream, Date.now())) return;
      s.reResolving = true;
      try {
        const stream = await resolveStream(video.id);
        // The page may have moved on to another Video meanwhile.
        if (session.current.video !== video) return;
        await applySource(video, stream, loaded.mode, s.position, autoplay);
      } finally {
        s.reResolving = false;
      }
    },
    [applySource],
  );

  // A (re)loaded Video: start it at `startAt`, or else its Resume Position.
  useEffect(() => {
    if (!data) return;
    let live = true;
    const s = session.current;
    s.video = data.video;
    s.duration = data.video.durationSeconds;
    s.loaded = null;
    s.reResolvedInARow = false;
    const at = startPosition(startAt, () => resumeAt(data.video.id));
    applySource(data.video, data.stream, getQualityMode(), at, true).catch(
      (error: unknown) => live && setFailure({ for: data, error: asVideoError(error, 'source') }),
    );
    return () => {
      live = false;
    };
  }, [data, startAt, applySource]);

  // Quality Mode changes keep the position. Android switches live via `maxResolution`;
  // iOS only treats it as a hint, so the rewritten source is reloaded at the current position.
  useEffect(() => {
    const s = session.current;
    player.maxResolution = maxResolutionFor(qualityMode, screenSize());
    if (Platform.OS !== 'ios' || !s.video || !s.loaded || s.loaded.mode === qualityMode) return;
    const { video, loaded } = s;
    const at = player.currentTime;
    const playing = player.playing;
    freshStream(video, loaded.stream)
      .then((stream) => applySource(video, stream, qualityMode, at, playing))
      .catch((error: unknown) => data && setFailure({ for: data, error: asVideoError(error, 'quality') }));
  }, [qualityMode, player, applySource, freshStream, data]);

  useEventListener(player, 'playingChange', ({ isPlaying }) => {
    const s = session.current;
    if (isPlaying) {
      setEnded(null);
      s.reResolvedInARow = false;
      // Resuming after a long pause: swap a Stream that is about to expire before YouTube rejects it.
      reResolve(false, true).catch(
        (error: unknown) => data && setFailure({ for: data, error: asVideoError(error, 'resume') }),
      );
      if (!s.started && s.video) {
        recordStart(s.video);
        s.started = true;
      }
    } else {
      save(player.currentTime);
    }
  });

  useEventListener(player, 'timeUpdate', ({ currentTime }) => {
    const s = session.current;
    s.position = currentTime;
    if (player.duration > 0) s.duration = player.duration;
    if (isSaveDue(s.lastSaved, currentTime)) save(currentTime);
  });

  useEventListener(player, 'playToEnd', () => {
    if (!data || !isRealEnd(player.currentTime, player.duration)) return;
    save(session.current.duration);
    setEnded(data);
  });

  // A rejected Stream (403, usually an expired link) is re-resolved once and continues where it was.
  useEventListener(player, 'statusChange', ({ status, error }) => {
    if (status !== 'error' || !data) return;
    const s = session.current;
    if (s.reResolving) return;
    const outcome = playerErrorOutcome(error?.message ?? '', s.reResolvedInARow);
    if ('error' in outcome) {
      setFailure({ for: data, error: outcome.error });
      return;
    }
    s.reResolvedInARow = true;
    reResolve(true, true).catch((e: unknown) => setFailure({ for: data, error: asVideoError(e, 'reresolve') }));
  });

  /** Shows `error` for the current load (used from listeners that outlive a render). */
  const fail = useEffectEvent((error: unknown, code: string) => {
    if (data) setFailure({ for: data, error: asVideoError(error, code) });
  });

  // Save when the app goes to the background, and when the page is left.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'background') save(session.current.position);
      // Back in the foreground: a Stream that went stale meanwhile is replaced at the same position.
      if (state === 'active') {
        reResolve(false, player.playing).catch((error: unknown) => fail(error, 'foreground'));
      }
    });
    const s = session.current;
    return () => {
      subscription.remove();
      save(s.position);
    };
  }, [save, reResolve, player]);

  const status: WatchStatus =
    load.status === 'loading'
      ? { state: 'loading' }
      : load.status === 'error'
        ? { state: 'error', error: asVideoError(load.error, 'load') }
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
