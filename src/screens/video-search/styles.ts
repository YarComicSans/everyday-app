import { StyleSheet } from 'react-native';

import { MaxContentWidth, Spacing } from '@/constants/theme';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    gap: Spacing.three,
    paddingVertical: Spacing.three,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  note: {
    paddingHorizontal: Spacing.three,
  },
  button: {
    marginHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: 12,
    alignItems: 'center',
  },
});
