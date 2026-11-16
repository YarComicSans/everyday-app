import { ScrollView } from 'react-native';

import { ThemedView } from '@/base/themed-view';

import { MenuTile } from './components/menu-tile';
import { styles } from './styles';

export default function MenuScreen() {
  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.grid} contentInsetAdjustmentBehavior="automatic">
        <MenuTile
          title="Bus timetable"
          subtitle="Novi Sad · GSP"
          icon={{ ios: 'bus.fill', android: 'directions_bus', web: 'directions_bus' }}
          href="/bus-timetable"
          color="#3E63DD"
        />
        <MenuTile
          title="Videos"
          subtitle="Search · History"
          icon={{ ios: 'play.rectangle.fill', android: 'smart_display', web: 'smart_display' }}
          href="/video"
          color="#E5484D"
        />
      </ScrollView>
    </ThemedView>
  );
}
