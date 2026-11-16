import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-splash-overlay';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <Stack>
        <Stack.Screen name="index" options={{ title: 'Menu' }} />
        <Stack.Screen name="bus-timetable/index" options={{ title: 'Pick lines' }} />
        <Stack.Screen name="bus-timetable/timetable" options={{ title: 'Timetable' }} />
        {/* The Video Section has its own Stack (src/app/video/_layout.tsx) with its own headers. */}
        <Stack.Screen name="video" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}
