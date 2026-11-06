import { StyleSheet } from 'react-native';

import { Spacing } from '@/constants/theme';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  body: {
    flex: 1,
    borderRadius: 8,
  },
  bodyContent: {
    padding: Spacing.two,
  },
  retry: {
    alignSelf: 'stretch',
    alignItems: 'center',
    paddingVertical: Spacing.three,
    borderRadius: 12,
  },
});
