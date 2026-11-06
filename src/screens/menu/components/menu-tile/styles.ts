import { StyleSheet } from 'react-native';

import { Spacing } from '@/constants/theme';

export const styles = StyleSheet.create({
  tile: {
    flexBasis: '47%',
    flexGrow: 0,
    aspectRatio: 1,
    borderRadius: 20,
    padding: Spacing.three,
    justifyContent: 'space-between',
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: {
    gap: Spacing.half,
  },
});
