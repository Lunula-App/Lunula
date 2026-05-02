import { useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { initDatabase, todayDate } from '../src/db/client';
import { useSettingsStore } from '../src/stores/settingsStore';
import { useAuthStore } from '../src/stores/authStore';
import { buildTheme } from '../src/theme';
import { AccentKey } from '../src/theme/accents';
import { syncNotifications, dismissCompletedNotificationsFromTray } from '../src/services/notificationService';
import { getLogForDate } from '../src/db/repositories/logRepository';
import { getSessionsForDate } from '../src/db/repositories/exerciseRepository';

export default function RootLayout() {
  const [dbReady, setDbReady] = useState(false);
  const colorScheme = useColorScheme();

  const { settings, isLoaded, load: loadSettings } = useSettingsStore();
  const { isUnlocked, hasPinSetup, checkSetup, lock, startBackgroundTimer } = useAuthStore();

  const router = useRouter();
  const segments = useSegments() as string[];

  // 1. Initialise DB on first mount
  useEffect(() => {
    initDatabase()
      .then(() => loadSettings())
      .then(() => setDbReady(true))
      .catch(console.error);
  }, []);

  // 2. Check auth setup once DB is ready
  useEffect(() => {
    if (dbReady) checkSetup();
  }, [dbReady]);

  // 3. Handle background → lock
  useEffect(() => {
    let cancelTimer: (() => void) | null = null;

    const subscription = AppState.addEventListener(
      'change',
      (state: AppStateStatus) => {
        if (state === 'background' || state === 'inactive') {
          if (hasPinSetup) cancelTimer = startBackgroundTimer();
        } else if (state === 'active') {
          if (cancelTimer) {
            cancelTimer();
            cancelTimer = null;
          }
          // Re-sync notifications on foreground: restores DAILY triggers that
          // were temporarily replaced with one-shot DATE triggers on completion
          // days, and clears any stale notifications from the system tray.
          const currentSettings = useSettingsStore.getState().settings;
          if (currentSettings) {
            (async () => {
              const today = todayDate();
              const [log, sessions] = await Promise.all([
                getLogForDate(today),
                getSessionsForDate(today),
              ]);
              await syncNotifications(currentSettings, {
                log: !!log,
                kegel: sessions.length > 0,
              });
              await dismissCompletedNotificationsFromTray();
            })().catch(() => {});
          }
        }
      }
    );

    return () => {
      subscription.remove();
      // Cancel any pending lock timer so it doesn't fire after the effect re-runs
      if (cancelTimer) {
        cancelTimer();
        cancelTimer = null;
      }
    };
  }, [hasPinSetup]);

  // 4. Navigation gate
  useEffect(() => {
    if (!dbReady || !isLoaded) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inAppGroup = segments[0] === '(app)';

    if (!settings?.onboardingComplete) {
      // Not onboarded — send to onboarding
      if (!inAuthGroup) router.replace('/(auth)/onboarding/welcome');
      return;
    }

    if (!isUnlocked && hasPinSetup) {
      // Onboarded but locked
      const inLockScreen = segments[0] === '(auth)' && segments[1] === 'lock';
      if (!inLockScreen) {
        router.replace('/(auth)/lock');
      }
      return;
    }

    if (isUnlocked && inAuthGroup) {
      // Unlocked — push to main app
      router.replace('/(app)/today');
    }
  }, [dbReady, isLoaded, settings, isUnlocked, hasPinSetup, segments]);

  const isDark =
    settings?.darkMode === 'dark' ||
    (settings?.darkMode === 'system' && colorScheme === 'dark');

  const theme = buildTheme(isDark, (settings?.accentColor ?? 'teal') as AccentKey);

  if (!dbReady) return null;

  return (
    <PaperProvider theme={theme}>
      <SafeAreaProvider>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <Slot />
      </SafeAreaProvider>
    </PaperProvider>
  );
}
