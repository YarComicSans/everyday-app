import type { ImageProps } from 'expo-image';
import type { useColorScheme } from 'react-native';

export function getBadgeSource(scheme: ReturnType<typeof useColorScheme>): ImageProps['source'] {
  return scheme === 'dark'
    ? require('@/assets/images/expo-badge-white.png')
    : require('@/assets/images/expo-badge.png');
}
