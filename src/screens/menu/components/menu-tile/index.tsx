import { Link } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, View } from 'react-native';

import { ThemedText } from '@/base/themed-text';
import { useTheme } from '@/hooks/use-theme';

import { styles } from './styles';
import type { MenuTileProps } from './types';

export function MenuTile({ title, subtitle, icon, href, color }: MenuTileProps) {
  const theme = useTheme();

  return (
    <Link href={href} asChild>
      <Pressable
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.tile,
          { backgroundColor: pressed ? theme.backgroundSelected : theme.backgroundElement },
        ]}>
        <View style={[styles.iconWrap, { backgroundColor: color }]}>
          <SymbolView name={icon} tintColor="#fff" size={32} />
        </View>
        <View style={styles.texts}>
          <ThemedText type="smallBold">{title}</ThemedText>
          {subtitle ? (
            <ThemedText type="small" themeColor="textSecondary">
              {subtitle}
            </ThemedText>
          ) : null}
        </View>
      </Pressable>
    </Link>
  );
}
