import { StyleSheet } from 'react-native';

import { Spacing } from '@/constants/theme';

/*
 * Every part of a row has a fixed height so the list can compute offsets
 * (getItemLayout) and jump straight to the current bus, even with a row expanded.
 */

/** Collapsed row. */
export const ROW_HEIGHT = 64;
/** NOW row's estimate line under the collapsed row. */
export const SUMMARY_HEIGHT = 24;
const DETAILS_PADDING = Spacing.two;
const DETAILS_LABEL_HEIGHT = 20;
const STOP_HEIGHT = 24;

/** Height of an expanded row's stop list with `lines` lines (placeholders count as one). */
export const detailsHeight = (lines: number) =>
  DETAILS_PADDING * 2 + DETAILS_LABEL_HEIGHT + Math.max(1, lines) * STOP_HEIGHT;

const TIME_WIDTH = 64;
/** Where the text column starts, so summary and stops line up with "from …". */
const BODY_INSET = Spacing.three + TIME_WIDTH + Spacing.three;

export const NOW_COLOR = '#30A46C';
export const NOW_BACKGROUND = '#30A46C26';

export const styles = StyleSheet.create({
  container: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  row: {
    height: ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
  },
  time: {
    width: TIME_WIDTH,
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
  statusLabel: {
    fontSize: 11,
    letterSpacing: 0.5,
  },
  chevron: {
    width: 16,
    alignItems: 'center',
  },
  summary: {
    height: SUMMARY_HEIGHT,
    flexDirection: 'row',
    gap: Spacing.one,
    paddingLeft: BODY_INSET,
    paddingRight: Spacing.three,
  },
  summaryStop: {
    flexShrink: 1,
  },
  details: {
    paddingVertical: DETAILS_PADDING,
    paddingLeft: BODY_INSET,
    paddingRight: Spacing.three,
  },
  detailsLabel: {
    height: DETAILS_LABEL_HEIGHT,
  },
  stop: {
    height: STOP_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  stopTime: {
    width: 44,
    fontVariant: ['tabular-nums'],
  },
  stopName: {
    flex: 1,
  },
});
