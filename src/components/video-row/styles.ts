import { StyleSheet } from 'react-native';

import { Spacing } from '@/constants/theme';

const THUMB_WIDTH = 160;

export const PROGRESS_COLOR = '#E5484D';

export const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  thumb: {
    width: THUMB_WIDTH,
    aspectRatio: 16 / 9,
    borderRadius: 8,
    overflow: 'hidden',
  },
  image: {
    ...StyleSheet.absoluteFill,
  },
  duration: {
    position: 'absolute',
    right: Spacing.one,
    bottom: Spacing.one + 3,
    borderRadius: 4,
    paddingHorizontal: Spacing.one,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  durationText: {
    color: '#fff',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: 600,
    fontVariant: ['tabular-nums'],
  },
  watchedTrack: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  watchedFill: {
    height: '100%',
    backgroundColor: PROGRESS_COLOR,
  },
  body: {
    flex: 1,
    gap: Spacing.half,
  },
});
