import { StyleSheet } from 'react-native';

export const SIZES = { sm: 28, md: 36 } as const;

export const styles = StyleSheet.create({
  badge: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
  },
  text: {
    fontWeight: 800,
  },
});
