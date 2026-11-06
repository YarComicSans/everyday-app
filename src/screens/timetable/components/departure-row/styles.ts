import { StyleSheet } from 'react-native';

import { Spacing } from '@/constants/theme';

/** Fixed so the list can jump straight to the next departure. */
export const ROW_HEIGHT = 64;

export const styles = StyleSheet.create({
  row: {
    height: ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  time: {
    width: 64,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: 600,
    fontVariant: ['tabular-nums'],
  },
  body: {
    flex: 1,
    gap: 2,
  },
  tags: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  tag: {
    borderRadius: 4,
    paddingHorizontal: 5,
    overflow: 'hidden',
    flexShrink: 1,
  },
  tagText: {
    fontSize: 11,
    lineHeight: 16,
  },
  nextLabel: {
    fontSize: 11,
    letterSpacing: 0.5,
  },
});
