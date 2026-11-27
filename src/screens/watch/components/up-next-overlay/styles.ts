import { StyleSheet } from 'react-native';

import { Spacing } from '@/constants/theme';

export const styles = StyleSheet.create({
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    padding: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  thumb: {
    width: 140,
    aspectRatio: 16 / 9,
    borderRadius: 8,
    backgroundColor: '#222',
  },
  body: {
    flex: 1,
    gap: Spacing.one,
  },
  label: {
    color: '#aaaaaa',
    fontSize: 12,
  },
  title: {
    color: '#ffffff',
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  play: {
    backgroundColor: '#ffffff',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + Spacing.half,
    borderRadius: 16,
  },
  playText: {
    color: '#000000',
    fontWeight: '600',
  },
  replay: {
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + Spacing.half,
    borderRadius: 16,
  },
  replayText: {
    color: '#ffffff',
  },
  pressed: {
    opacity: 0.7,
  },
});
