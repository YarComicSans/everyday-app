import { Stack } from 'expo-router';

export default function VideoLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Videos' }} />
      <Stack.Screen name="watch" options={{ title: 'Watch' }} />
    </Stack>
  );
}
