import { StyleSheet } from 'react-native';

import { Spacing } from '@/constants/theme';

export const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  title: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.one,
  },
  message: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  last: {
    paddingBottom: Spacing.three,
  },
});
