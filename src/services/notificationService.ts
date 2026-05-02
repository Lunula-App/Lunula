/**
 * Notification service for Lunula.
 *
 * Manages three notification channels:
 *   - Daily logging reminder  (fixed time each day)
 *   - Upcoming period alert   (N days before predicted next period)
 *   - Kegel exercise reminder (fixed time each day)
 *
 * Scheduling strategy: all scheduled notifications are cancelled and
 * re-scheduled whenever the user saves their notification preferences.
 * This keeps things simple — no stale notifications accumulate.
 *
 * Completion-aware suppression:
 *   - setNotificationHandler checks the DB before showing a notification
 *     while the app is in the foreground.
 *   - syncNotifications accepts a completedToday map; when an activity is
 *     done and its notification hasn't fired yet, the trigger is moved to a
 *     one-shot DATE for tomorrow so today's slot is skipped entirely.
 *   - dismissCompletedNotificationsFromTray removes any already-delivered
 *     notifications from the system tray when the app returns to the foreground.
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { UserSettings } from '../models/cycle';
import { computePrediction } from './cycleEngine';
import { getLogForDate } from '../db/repositories/logRepository';
import { getSessionsForDate } from '../db/repositories/exerciseRepository';
import { todayDate } from '../db/client';

// Notification IDs used as identifiers so we can cancel/replace them
const ID_DAILY_LOG = 'lunula_daily_log';
const ID_PERIOD_REMINDER = 'lunula_period_reminder';
const ID_KEGEL = 'lunula_kegel';
const ID_BACKUP_PREFIX = 'lunula_backup_';

const SHOW = {
  shouldShowAlert: true,
  shouldShowBanner: true,
  shouldShowList: true,
  shouldPlaySound: true,
  shouldSetBadge: false,
};

const SUPPRESS = {
  shouldShowAlert: false,
  shouldShowBanner: false,
  shouldShowList: false,
  shouldPlaySound: false,
  shouldSetBadge: false,
};

// Suppress notifications in the foreground when the activity is already done today.
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const id = notification.request.identifier;
    const today = todayDate();

    if (id === ID_DAILY_LOG) {
      const log = await getLogForDate(today);
      if (log) return SUPPRESS;
    }

    if (id === ID_KEGEL) {
      const sessions = await getSessionsForDate(today);
      if (sessions.length > 0) return SUPPRESS;
    }

    return SHOW;
  },
});

// ── Permissions ────────────────────────────────────────────────────────────────

export async function requestNotificationPermission(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return false;

  // Android 8+ needs a channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('lunula_default', {
      name: 'Lunula Reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  return true;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function parseTime(hhmm: string): { hour: number; minute: number } {
  const parts = hhmm.split(':');
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const hour = Number.isFinite(h) && h >= 0 && h <= 23 ? h : 20;
  const minute = Number.isFinite(m) && m >= 0 && m <= 59 ? m : 0;
  return { hour, minute };
}

async function cancelNotification(id: string) {
  await Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
}

// ── Schedule / cancel ──────────────────────────────────────────────────────────

async function scheduleDailyLog(time: string, skipToday = false) {
  await cancelNotification(ID_DAILY_LOG);
  const { hour, minute } = parseTime(time);
  const content = {
    title: "Time to check in 🌸",
    body: "Log how you're feeling today in Lunula.",
  };

  if (skipToday) {
    const now = new Date();
    const todayFire = new Date();
    todayFire.setHours(hour, minute, 0, 0);

    if (todayFire > now) {
      // Notification hasn't fired yet — schedule one-shot for tomorrow so
      // today's slot is skipped, then syncNotifications will restore DAILY
      // next time the app comes to the foreground.
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(hour, minute, 0, 0);
      await Notifications.scheduleNotificationAsync({
        identifier: ID_DAILY_LOG,
        content,
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: tomorrow,
        },
      });
      return;
    }
    // Time has already passed — DAILY trigger naturally starts from tomorrow.
  }

  await Notifications.scheduleNotificationAsync({
    identifier: ID_DAILY_LOG,
    content,
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

  const periodDate = new Date(anchorDate + 'T00:00:00');
  const targetDate = new Date(anchorDate + 'T00:00:00');
  targetDate.setDate(targetDate.getDate() - settings.notifyPeriodDaysBefore);
  targetDate.setHours(9, 0, 0, 0);

  if (targetDate.getTime() <= Date.now()) {
    // Reminder window passed — if the period itself is still upcoming, fire at
    // the next 9 AM so the user still gets an alert rather than nothing.
    if (periodDate.getTime() <= Date.now()) return;
    targetDate.setTime(Date.now());
    targetDate.setHours(9, 0, 0, 0);
    if (targetDate.getTime() <= Date.now()) {
      targetDate.setDate(targetDate.getDate() + 1);
    }
  }

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

async function cancelBackupReminders() {
  // Cancel all previously scheduled backup notifications (up to 12 slots)
  await Promise.all(
    Array.from({ length: 12 }, (_, i) =>
      Notifications.cancelScheduledNotificationAsync(`${ID_BACKUP_PREFIX}${i}`).catch(() => {})
    )
  );
}

async function scheduleBackupReminders(intervalWeeks: 1 | 2 | 4) {
  await cancelBackupReminders();
  const intervalMs = intervalWeeks * 7 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  // Schedule 12 occurrences so reminders run for up to a year without re-registration
  for (let i = 0; i < 12; i++) {
    const fireDate = new Date(now + intervalMs * (i + 1));
    fireDate.setHours(9, 0, 0, 0);
    if (fireDate.getTime() <= Date.now()) continue;
    await Notifications.scheduleNotificationAsync({
      identifier: `${ID_BACKUP_PREFIX}${i}`,
      content: {
        title: 'Lunula backup reminder',
        body: 'Back up your Lunula data to keep it safe. It only takes a moment.',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: fireDate,
      },
    });
  }
}

async function scheduleKegel(time: string, skipToday = false) {
  await cancelNotification(ID_KEGEL);
  const { hour, minute } = parseTime(time);
  const content = {
    title: 'Kegel reminder',
    body: 'A few minutes of pelvic floor exercises makes a difference.',
  };

  if (skipToday) {
    const now = new Date();
    const todayFire = new Date();
    todayFire.setHours(hour, minute, 0, 0);

    if (todayFire > now) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(hour, minute, 0, 0);
      await Notifications.scheduleNotificationAsync({
        identifier: ID_KEGEL,
        content,
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: tomorrow,
        },
      });
      return;
    }
  }

  await Notifications.scheduleNotificationAsync({
    identifier: ID_KEGEL,
    content,
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
 * Call this after the user changes any notification preference, and on every
 * app foreground to restore DAILY triggers that were temporarily replaced with
 * one-shot DATE triggers on completion days.
 *
 * completedToday.log   — true if the daily log has been saved today
 * completedToday.kegel — true if any exercise session has been saved today
 */
export async function syncNotifications(
  settings: UserSettings,
  completedToday: { log?: boolean; kegel?: boolean } = {}
): Promise<void> {
  if (settings.notifyDailyLog) {
    await scheduleDailyLog(settings.notifyDailyLogTime, completedToday.log ?? false);
  } else {
    await cancelNotification(ID_DAILY_LOG);
  }

  if (settings.notifyPeriodReminder) {
    await schedulePeriodReminder(settings);
  } else {
    await cancelNotification(ID_PERIOD_REMINDER);
  }

  if (settings.notifyKegel) {
    await scheduleKegel(settings.notifyKegelTime, completedToday.kegel ?? false);
  } else {
    await cancelNotification(ID_KEGEL);
  }

  if (settings.notifyBackup) {
    await scheduleBackupReminders(settings.notifyBackupIntervalWeeks);
  } else {
    await cancelBackupReminders();
  }
}

/**
 * Removes already-delivered log and kegel notifications from the system tray
 * if the corresponding activity has been completed today.
 * Call this when the app returns to the foreground.
 */
export async function dismissCompletedNotificationsFromTray(): Promise<void> {
  const today = todayDate();
  const [log, sessions] = await Promise.all([
    getLogForDate(today),
    getSessionsForDate(today),
  ]);

  await Promise.all([
    log
      ? Notifications.dismissNotificationAsync(ID_DAILY_LOG).catch(() => {})
      : Promise.resolve(),
    sessions.length > 0
      ? Notifications.dismissNotificationAsync(ID_KEGEL).catch(() => {})
      : Promise.resolve(),
  ]);
}

/** Cancels every Lunula notification (used when permissions are revoked). */
export async function cancelAllNotifications(): Promise<void> {
  await Promise.all([
    cancelNotification(ID_DAILY_LOG),
    cancelNotification(ID_PERIOD_REMINDER),
    cancelNotification(ID_KEGEL),
    cancelBackupReminders(),
  ]);
}
