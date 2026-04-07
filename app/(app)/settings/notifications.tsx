import { useState } from 'react';
import { View, StyleSheet, ScrollView, Modal, TouchableOpacity, FlatList } from 'react-native';
import { Text, useTheme, Surface, List, Switch, Divider, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useSettingsStore } from '../../../src/stores/settingsStore';
import { requestNotificationPermission, syncNotifications, cancelAllNotifications } from '../../../src/services/notificationService';
import { UserSettings } from '../../../src/models/cycle';

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = [0, 15, 30, 45];

type TimeField = 'notifyDailyLogTime' | 'notifyKegelTime';

export default function NotificationsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { settings, update } = useSettingsStore();

  const [timePicker, setTimePicker] = useState<{ field: TimeField; value: string } | null>(null);

  if (!settings) return null;

  async function toggle(
    field: keyof Pick<UserSettings, 'notifyDailyLog' | 'notifyPeriodReminder' | 'notifyKegel'>,
    value: boolean
  ) {
    if (value) {
      const granted = await requestNotificationPermission();
      if (!granted) return;
    }
    const updated = { ...settings!, [field]: value };
    await update({ [field]: value });
    await syncNotifications({ ...settings!, ...updated });

    if (!updated.notifyDailyLog && !updated.notifyPeriodReminder && !updated.notifyKegel) {
      await cancelAllNotifications();
    }
  }

  async function saveTime(field: TimeField, value: string) {
    await update({ [field]: value });
    await syncNotifications({ ...settings!, [field]: value });
    setTimePicker(null);
  }

  function formatTime(hhmm: string) {
    const [h, m] = hhmm.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:${String(m).padStart(2, '0')} ${period}`;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.onBackground }]}>
          Notifications
        </Text>

        {/* Daily logging reminder */}
        <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <List.Subheader>Daily Logging</List.Subheader>
          <Divider />
          <List.Item
            title="Daily reminder"
            description="Prompt you to log each day"
            left={(props) => <List.Icon {...props} icon="notebook-outline" />}
            right={() => (
              <Switch
                value={settings.notifyDailyLog}
                onValueChange={(val) => toggle('notifyDailyLog', val)}
                color={theme.colors.primary}
              />
            )}
          />
          {settings.notifyDailyLog && (
            <>
              <Divider />
              <List.Item
                title="Reminder time"
                description={formatTime(settings.notifyDailyLogTime)}
                left={(props) => <List.Icon {...props} icon="clock-outline" />}
                right={(props) => <List.Icon {...props} icon="chevron-right" />}
                onPress={() => setTimePicker({ field: 'notifyDailyLogTime', value: settings.notifyDailyLogTime })}
              />
            </>
          )}
        </Surface>

        {/* Period reminder */}
        <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <List.Subheader>Period Reminder</List.Subheader>
          <Divider />
          <List.Item
            title="Upcoming period alert"
            description={`Notified ${settings.notifyPeriodDaysBefore} day${settings.notifyPeriodDaysBefore !== 1 ? 's' : ''} before your predicted period`}
            left={(props) => <List.Icon {...props} icon="calendar-alert" />}
            right={() => (
              <Switch
                value={settings.notifyPeriodReminder}
                onValueChange={(val) => toggle('notifyPeriodReminder', val)}
                color={theme.colors.primary}
              />
            )}
          />
          {settings.notifyPeriodReminder && (
            <>
              <Divider />
              <List.Item
                title="Days before period"
                description={`${settings.notifyPeriodDaysBefore} day${settings.notifyPeriodDaysBefore !== 1 ? 's' : ''}`}
                left={(props) => <List.Icon {...props} icon="numeric" />}
                right={() => (
                  <View style={styles.stepperRow}>
                    <TouchableOpacity
                      onPress={async () => {
                        const v = Math.max(1, settings.notifyPeriodDaysBefore - 1);
                        await update({ notifyPeriodDaysBefore: v });
                        await syncNotifications({ ...settings, notifyPeriodDaysBefore: v });
                      }}
                      style={[styles.stepBtn, { borderColor: theme.colors.outline }]}
                    >
                      <Text style={{ color: theme.colors.onSurface }}>−</Text>
                    </TouchableOpacity>
                    <Text style={[styles.stepValue, { color: theme.colors.onSurface }]}>
                      {settings.notifyPeriodDaysBefore}
                    </Text>
                    <TouchableOpacity
                      onPress={async () => {
                        const v = Math.min(7, settings.notifyPeriodDaysBefore + 1);
                        await update({ notifyPeriodDaysBefore: v });
                        await syncNotifications({ ...settings, notifyPeriodDaysBefore: v });
                      }}
                      style={[styles.stepBtn, { borderColor: theme.colors.outline }]}
                    >
                      <Text style={{ color: theme.colors.onSurface }}>+</Text>
                    </TouchableOpacity>
                  </View>
                )}
              />
            </>
          )}
        </Surface>

        {/* Kegel reminder */}
        <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <List.Subheader>Kegel Exercises</List.Subheader>
          <Divider />
          <List.Item
            title="Exercise reminder"
            description="Daily prompt to complete your exercises"
            left={(props) => <List.Icon {...props} icon="yoga" />}
            right={() => (
              <Switch
                value={settings.notifyKegel}
                onValueChange={(val) => toggle('notifyKegel', val)}
                color={theme.colors.primary}
              />
            )}
          />
          {settings.notifyKegel && (
            <>
              <Divider />
              <List.Item
                title="Reminder time"
                description={formatTime(settings.notifyKegelTime)}
                left={(props) => <List.Icon {...props} icon="clock-outline" />}
                right={(props) => <List.Icon {...props} icon="chevron-right" />}
                onPress={() => setTimePicker({ field: 'notifyKegelTime', value: settings.notifyKegelTime })}
              />
            </>
          )}
        </Surface>
      </ScrollView>

      {/* Time picker modal */}
      <Modal visible={!!timePicker} transparent animationType="slide" onRequestClose={() => setTimePicker(null)}>
        <View style={styles.modalBackdrop}>
          <Surface style={[styles.modalSheet, { backgroundColor: theme.colors.surface }]} elevation={4}>
            <Text variant="titleMedium" style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
              Select time
            </Text>
            {timePicker && (
              <TimePicker
                value={timePicker.value}
                onConfirm={(val) => saveTime(timePicker.field, val)}
                onCancel={() => setTimePicker(null)}
                theme={theme}
              />
            )}
          </Surface>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function TimePicker({
  value,
  onConfirm,
  onCancel,
  theme,
}: {
  value: string;
  onConfirm: (val: string) => void;
  onCancel: () => void;
  theme: ReturnType<typeof useTheme>;
}) {
  const [h, m] = value.split(':').map(Number);
  const [selectedHour, setSelectedHour] = useState(h ?? 20);
  const [selectedMinute, setSelectedMinute] = useState(m ?? 0);

  function formatHour(hour: number) {
    const period = hour >= 12 ? 'PM' : 'AM';
    const display = hour % 12 || 12;
    return `${display} ${period}`;
  }

  return (
    <View>
      <View style={styles.pickerRow}>
        {/* Hour column */}
        <View style={styles.pickerColumn}>
          <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center', marginBottom: 4 }}>
            HOUR
          </Text>
          <FlatList
            data={HOURS}
            keyExtractor={(item) => String(item)}
            style={styles.pickerList}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => setSelectedHour(item)} style={styles.pickerItem}>
                <Text
                  variant="bodyLarge"
                  style={{
                    color: item === selectedHour ? theme.colors.primary : theme.colors.onSurface,
                    fontWeight: item === selectedHour ? '700' : '400',
                    textAlign: 'center',
                  }}
                >
                  {formatHour(item)}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* Minute column */}
        <View style={styles.pickerColumn}>
          <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center', marginBottom: 4 }}>
            MINUTE
          </Text>
          <FlatList
            data={MINUTES}
            keyExtractor={(item) => String(item)}
            style={styles.pickerList}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => setSelectedMinute(item)} style={styles.pickerItem}>
                <Text
                  variant="bodyLarge"
                  style={{
                    color: item === selectedMinute ? theme.colors.primary : theme.colors.onSurface,
                    fontWeight: item === selectedMinute ? '700' : '400',
                    textAlign: 'center',
                  }}
                >
                  :{String(item).padStart(2, '0')}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>

      <View style={styles.modalActions}>
        <Button onPress={onCancel}>Cancel</Button>
        <Button
          mode="contained"
          onPress={() =>
            onConfirm(`${String(selectedHour).padStart(2, '0')}:${String(selectedMinute).padStart(2, '0')}`)
          }
        >
          Confirm
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32, gap: 14 },
  title: { fontWeight: '700', paddingHorizontal: 4 },
  card: { borderRadius: 16, overflow: 'hidden' },
  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginRight: 8 },
  stepBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepValue: { fontSize: 16, fontWeight: '600', minWidth: 20, textAlign: 'center' },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: { fontWeight: '700', marginBottom: 16, textAlign: 'center' },
  pickerRow: { flexDirection: 'row', gap: 16, justifyContent: 'center' },
  pickerColumn: { flex: 1 },
  pickerList: { height: 200 },
  pickerItem: { paddingVertical: 12, alignItems: 'center' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 16 },
});
