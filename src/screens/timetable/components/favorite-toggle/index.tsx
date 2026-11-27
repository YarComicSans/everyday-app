import { SymbolView } from 'expo-symbols';
import { Pressable, Text } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

import { FAVORITE_COLOR, styles } from './styles';
import type { FavoriteToggleProps } from './types';

/** Timetable header star: filled when these Lines and Directions are a Favorite. */
export function FavoriteToggle({ saved, onPress }: FavoriteToggleProps) {
  const theme = useTheme();
  const color = saved ? FAVORITE_COLOR : theme.text;

  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityState={{ selected: saved }}
      accessibilityLabel={saved ? 'Remove from Favorites' : 'Save as Favorite'}
      style={({ pressed }) => [styles.button, { opacity: pressed ? 0.6 : 1 }]}>
      <SymbolView
        name={
          saved
            ? { ios: 'star.fill', android: 'star', web: 'star' }
            : { ios: 'star', android: 'star_outline', web: 'star_outline' }
        }
        tintColor={color}
        size={22}
        fallback={<Text style={[styles.fallback, { color }]}>{saved ? '★' : '☆'}</Text>}
      />
    </Pressable>
  );
}
