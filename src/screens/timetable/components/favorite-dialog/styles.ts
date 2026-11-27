import { StyleSheet } from 'react-native';

import { Spacing } from '@/constants/theme';

export const DESTRUCTIVE_COLOR = '#E5484D';
export const CONFIRM_COLOR = '#3E63DD';

export const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.four,
    backgroundColor: '#00000066',
  },
  dialog: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    borderRadius: 16,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  title: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: 600,
  },
  input: {
    borderRadius: 10,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.two,
  },
  button: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 10,
  },
});
