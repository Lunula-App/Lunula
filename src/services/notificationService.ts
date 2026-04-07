/**
 * Notification service for Bloom.
 *
 * Manages three notification channels:
 *   - Daily logging reminder  (fixed time each day)
 *   - Upcoming period alert   (N days before predicted next period)
 *   - Kegel exercise reminder (fixed time each day)
 *
 * Scheduling strategy: all scheduled notifications are cancelled and
 * re-scheduled whenever the user saves their notification preferences.
 * This keeps things simple — no stale notifications accumulate.
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { UserSettings } from '../models/cycle';
import { computePrediction } from './cycleEngine';

// Notification IDs used as identifiers so we can cancel/replace them
const ID_DAILY_LOG = 'bloom_daily_log';
const ID_PERIOD_REMINDER = 'bloom_period_reminder';
const ID_KEGEL = 'bloom_kegel';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// ── Permissions ────────────────────────────────────────────────────────────────

export async function requestNotificationPermission(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return false;

  // Android 8+ needs a channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('bloom_default', {
      name: 'Bloom Reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  return true;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function parseTime(hhmm: string): { hour: number; minute: number } {
  const [h, m] = hhmm.split(':').map(Number);
  return { hour: h ?? 20, minute: m ?? 0 };
}

async function cancelNotification(id: string) {
  await Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
}

// ── Schedule / cancel ──────────────────────────────────────────────────────────

async function scheduleDailyLog(time: string) {
  await cancelNotification(ID_DAILY_LOG);
  const { hour, minute } = parseTime(time);
  await Notifications.scheduleNotificationAsync({
    identifier: ID_DAILY_LOG,
    content: {
      title: "Time to check in 🌸",
      body: "Log how you're feeling today in Bloom.",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

async function schedulePeriodReminder(settings: UserSettings) {
  await cancelNotification(ID_PERIOD_REMINDER);
  const prediction = computePrediction(settings);
  if (!prediction) return;

  // For irregular cycles use the earliest predicted date so the alert isn't late
  const anchorDate = prediction.isIrregular && prediction.nextPeriodEarliestDate
    ? prediction.nextPeriodEarliestDate
    : prediction.nextPeriodDate;

  const targetDate = new Date(anchorDate);
  targetDate.setDate(targetDate.getDate() - settings.notifyPeriodDaysBefore);
  targetDate.setHours(9, 0, 0, 0);

  if (targetDate.getTime() <= Date.now()) return;

  const body = prediction.isIrregular
    ? 'Your period window is approaching. Take care of yourself.'
    : `Your period is predicted in ${settings.notifyPeriodDaysBefore} day${settings.notifyPeriodDaysBefore !== 1 ? 's' : ''}. Take care of yourself.`;

  await Notifications.scheduleNotificationAsync({
    identifier: ID_PERIOD_REMINDER,
    content: { title: 'Period expected soon', body },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: targetDate,
    },
  });
}

async function scheduleKegel(time: string) {
  await cancelNotification(ID_KEGEL);
  const { hour, minute } = parseTime(time);
  await Notifications.scheduleNotificationAsync({
    identifier: ID_KEGEL,
    content: {
      title: 'Kegel reminder',
      body: 'A few minutes of pelvic floor exercises makes a difference.',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Re-schedules (or cancels) all notifications based on current settings.
 * Call this after the user changes any notification preference.
 */
export async function syncNotifications(settings: UserSettings): Promise<void> {
  if (settings.notifyDailyLog) {
    await scheduleDailyLog(settings.notifyDailyLogTime);
  } else {
    await cancelNotification(ID_DAILY_LOG);
  }

  if (settings.notifyPeriodReminder) {
    await schedulePeriodReminder(settings);
  } else {
    await cancelNotification(ID_PERIOD_REMINDER);
  }

  if (settings.notifyKegel) {
    await scheduleKegel(settings.notifyKegelTime);
  } else {
    await cancelNotification(ID_KEGEL);
  }
}

/** Cancels every Bloom notification (used when permissions are revoked). */
export async function cancelAllNotifications(): Promise<void> {
  await Promise.all([
    cancelNotification(ID_DAILY_LOG),
    cancelNotification(ID_PERIOD_REMINDER),
    cancelNotification(ID_KEGEL),
  ]);
}
