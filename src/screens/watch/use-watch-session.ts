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
import { loadVideo, VideoError, type LoadedVideo, type Stream, type VideoSummary } from '@/services/youtube';

import { isRealEnd, isSaveDue, startPosition } from './helpers';

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

  // A (re)loaded Video: start it at `startAt`, or else its Resume Position.
  useEffect(() => {
    if (!data) return;
    let live = true;
    const s = session.current;
    s.video = data.video;
    s.duration = data.video.durationSeconds;
    s.loaded = null;
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
    applySource(s.video, s.loaded.stream, qualityMode, player.currentTime, player.playing).catch(
      (error: unknown) => data && setFailure({ for: data, error: asVideoError(error, 'quality') }),
    );
  }, [qualityMode, player, applySource, data]);

  useEventListener(player, 'playingChange', ({ isPlaying }) => {
    const s = session.current;
    if (isPlaying) {
      setEnded(null);
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

  useEventListener(player, 'statusChange', ({ status, error }) => {
    if (status !== 'error' || !data) return;
    setFailure({ for: data, error: new VideoError('failed', { code: 'player', detail: error?.message }) });
  });

  // Save when the app goes to the background, and when the page is left.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'background') save(session.current.position);
    });
    const s = session.current;
    return () => {
      subscription.remove();
      save(s.position);
    };
  }, [save]);

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
