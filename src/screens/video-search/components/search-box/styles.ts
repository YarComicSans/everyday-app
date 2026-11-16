import { StyleSheet } from 'react-native';

import { Spacing } from '@/constants/theme';

export const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.three,
    borderRadius: 12,
    paddingLeft: Spacing.three,
  },
  disabled: {
    opacity: 0.5,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: Spacing.two + Spacing.one,
  },
  clear: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
});
