import { useState } from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { Text, Button, useTheme, TextInput, HelperText, Surface } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar } from 'react-native-calendars';
import { format, subDays, parseISO } from 'date-fns';
import { useSettingsStore } from '../../../src/stores/settingsStore';
import { useAuthStore } from '../../../src/stores/authStore';

export default function LastPeriodScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { cycleLength, periodDuration, isIrregular } = useLocalSearchParams<{
    cycleLength: string;
    periodDuration: string;
    isIrregular: string;
  }>();

  const { update: updateSettings } = useSettingsStore();
  const { setupPin } = useAuthStore();

  const [selectedDate, setSelectedDate] = useState<string>('');
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [dateError, setDateError] = useState('');
  const [pin, setPin] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [pinError, setPinError] = useState('');
  const [skipPin, setSkipPin] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const today = format(new Date(), 'yyyy-MM-dd');

  function validate(): boolean {
    let valid = true;

    if (!selectedDate) {
      setDateError('Please select a date');
      valid = false;
    } else {
      setDateError('');
    }

    if (!skipPin) {
      if (pin.length < 4) {
        setPinError('PIN must be at least 4 digits');
        valid = false;
      } else if (pin !== pinConfirm) {
        setPinError('PINs do not match');
        valid = false;
      } else {
        setPinError('');
      }
    }

    return valid;
  }

  async function handleFinish() {
    if (!validate()) return;
    setSaving(true);
    setSaveError('');
    try {
      const endDate = parseISO(selectedDate);
      const startDate = subDays(endDate, parseInt(periodDuration ?? '5') - 1);

      await updateSettings({
        avgCycleLength: parseInt(cycleLength ?? '28'),
        avgPeriodDuration: parseInt(periodDuration ?? '5'),
        lastPeriodEndDate: format(endDate, 'yyyy-MM-dd'),
        lastPeriodStartDate: format(startDate, 'yyyy-MM-dd'),
        isIrregular: isIrregular === '1',
        onboardingComplete: true,
      });

      if (!skipPin && pin.length >= 4) {
        await setupPin(pin);
      }

      router.replace('/(app)/today');
    } catch (e: any) {
      setSaveError(e.message ?? 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  const displayDate = selectedDate
    ? format(parseISO(selectedDate), 'EEEE, d MMMM yyyy')
    : '';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.onBackground }]}>
            Last Period
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            When did your last period end? This lets Bloom calculate your current phase.
          </Text>
        </View>

        {/* Date picker trigger */}
        <View style={styles.section}>
          <TouchableOpacity
            onPress={() => setCalendarOpen(true)}
            activeOpacity={0.7}
          >
            <Surface
              style={[
                styles.datePicker,
                {
                  borderColor: dateError ? theme.colors.error : theme.colors.outline,
                  backgroundColor: theme.colors.surface,
                },
              ]}
              elevation={0}
            >
              <View style={styles.datePickerInner}>
                <Text
                  variant="bodyLarge"
                  style={{
                    color: selectedDate ? theme.colors.onSurface : theme.colors.onSurfaceVariant,
                    flex: 1,
                  }}
                >
                  {selectedDate ? displayDate : 'Select date'}
                </Text>
                <Text style={{ fontSize: 20 }}>📅</Text>
              </View>
            </Surface>
          </TouchableOpacity>
          {!!dateError && (
            <HelperText type="error" visible>
              {dateError}
            </HelperText>
          )}
        </View>

        {/* PIN section */}
        <View style={styles.section}>
          <Text variant="titleMedium" style={{ color: theme.colors.onBackground }}>
            Protect with a PIN
          </Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            Optional — keeps your data private if someone picks up your phone.
          </Text>

          {!skipPin && (
            <>
              <TextInput
                label="Choose a PIN (4–6 digits)"
                value={pin}
                onChangeText={setPin}
                keyboardType="number-pad"
                secureTextEntry
                maxLength={6}
                mode="outlined"
                style={{ marginTop: 12 }}
              />
              <TextInput
                label="Confirm PIN"
                value={pinConfirm}
                onChangeText={setPinConfirm}
                keyboardType="number-pad"
                secureTextEntry
                maxLength={6}
                mode="outlined"
                style={{ marginTop: 8 }}
                error={!!pinError}
              />
              {!!pinError && (
                <HelperText type="error" visible>
                  {pinError}
                </HelperText>
              )}
            </>
          )}

          <Button
            mode="text"
            onPress={() => setSkipPin((v) => !v)}
            style={{ alignSelf: 'flex-start' }}
          >
            {skipPin ? 'Add a PIN instead' : 'Skip — no PIN'}
          </Button>
        </View>

        <View style={styles.footer}>
          {!!saveError && (
            <HelperText type="error" visible style={{ textAlign: 'center' }}>
              {saveError}
            </HelperText>
          )}
          <Button
            mode="contained"
            onPress={handleFinish}
            loading={saving}
            disabled={saving}
            style={styles.button}
            contentStyle={styles.buttonContent}
          >
            Start Tracking
          </Button>
        </View>
      </ScrollView>

      {/* Calendar modal */}
      <Modal
        visible={calendarOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setCalendarOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setCalendarOpen(false)}
        >
          <TouchableOpacity activeOpacity={1}>
            <Surface
              style={[styles.calendarSheet, { backgroundColor: theme.colors.surface }]}
              elevation={4}
            >
              <View style={styles.calendarHeader}>
                <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
                  Select end date of last period
                </Text>
              </View>
              <Calendar
                maxDate={today}
                onDayPress={(day: { dateString: string }) => {
                  setSelectedDate(day.dateString);
                  setDateError('');
                  setCalendarOpen(false);
                }}
                markedDates={
                  selectedDate
                    ? { [selectedDate]: { selected: true, selectedColor: theme.colors.primary } }
                    : {}
                }
                theme={{
                  backgroundColor: theme.colors.surface,
                  calendarBackground: theme.colors.surface,
                  textSectionTitleColor: theme.colors.onSurfaceVariant,
                  selectedDayBackgroundColor: theme.colors.primary,
                  selectedDayTextColor: theme.colors.onPrimary,
                  todayTextColor: theme.colors.primary,
                  dayTextColor: theme.colors.onSurface,
                  textDisabledColor: theme.colors.onSurfaceDisabled,
                  arrowColor: theme.colors.primary,
                  monthTextColor: theme.colors.onSurface,
                  textDayFontSize: 15,
                  textMonthFontSize: 16,
                  textDayHeaderFontSize: 13,
                }}
              />
              <View style={{ padding: 16 }}>
                <Button mode="outlined" onPress={() => setCalendarOpen(false)}>
                  Cancel
                </Button>
              </View>
            </Surface>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 24, paddingTop: 24, gap: 28, paddingBottom: 24 },
  header: { gap: 8 },
  title: { fontWeight: '700' },
  section: { gap: 4 },
  datePicker: {
    borderRadius: 4,
    borderWidth: 1,
  },
  datePickerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 18,
    gap: 12,
  },
  footer: { paddingTop: 8, paddingBottom: 8 },
  button: { borderRadius: 28 },
  buttonContent: { paddingVertical: 8 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  calendarSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  calendarHeader: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
});
