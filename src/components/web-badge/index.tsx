import { version } from 'expo/package.json';
import { Image } from 'expo-image';
import { useColorScheme } from 'react-native';

import { ThemedText } from '@/base/themed-text';
import { ThemedView } from '@/base/themed-view';

import { getBadgeSource } from './helpers';
import { styles } from './styles';

export function WebBadge() {
  const scheme = useColorScheme();

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="code" themeColor="textSecondary" style={styles.versionText}>
        v{version}
      </ThemedText>
      <Image source={getBadgeSource(scheme)} style={styles.badgeImage} />
    </ThemedView>
  );
}
