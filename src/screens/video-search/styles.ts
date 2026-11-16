import { StyleSheet } from 'react-native';

import { MaxContentWidth, Spacing } from '@/constants/theme';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  top: {
    gap: Spacing.three,
    paddingVertical: Spacing.three,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  list: {
    paddingBottom: Spacing.four,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.two,
  },
  note: {
    paddingHorizontal: Spacing.three,
  },
  loading: {
    marginTop: Spacing.four,
  },
});
