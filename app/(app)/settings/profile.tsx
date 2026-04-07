import { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, useTheme, Switch, Surface, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useSettingsStore } from '../../../src/stores/settingsStore';

const CYCLE_LENGTHS = [21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35];
const IRREGULAR_LENGTHS = Array.from({ length: 25 }, (_, i) => i + 21); // 21–45
const PERIOD_DURATIONS = [2, 3, 4, 5, 6, 7, 8];

export default function ProfileScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { settings, update } = useSettingsStore();

  const [cycleLength, setCycleLength] = useState(settings?.avgCycleLength ?? 28);
  const [periodDuration, setPeriodDuration] = useState(settings?.avgPeriodDuration ?? 5);
  const [isIrregular, setIsIrregular] = useState(settings?.isIrregular ?? false);
  const [minCycle, setMinCycle] = useState(settings?.minCycleLength ?? 24);
  const [maxCycle, setMaxCycle] = useState(settings?.maxCycleLength ?? 35);
  const [saving, setSaving] = useState(false);

  const rangeValid = maxCycle > minCycle;

  async function handleSave() {
    if (isIrregular && !rangeValid) return;

    setSaving(true);

    if (isIrregular) {
      // Use midpoint as avgCycleLength for phase estimation
      const midpoint = Math.round((minCycle + maxCycle) / 2);
      await update({
        isIrregular: true,
        minCycleLength: minCycle,
        maxCycleLength: maxCycle,
        avgCycleLength: midpoint,
        avgPeriodDuration: periodDuration,
      });
    } else {
      await update({
        isIrregular: false,
        minCycleLength: null,
        maxCycleLength: null,
        avgCycleLength: cycleLength,
        avgPeriodDuration: periodDuration,
      });
    }

    setSaving(false);
    router.back();
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Button mode="text" onPress={() => router.back()} icon="arrow-left">
          Back
        </Button>
        <Text variant="titleLarge" style={[styles.title, { color: theme.colors.onBackground }]}>
          Cycle Profile
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Irregular toggle */}
        <Surface style={[styles.toggleCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleText}>
              <Text variant="titleSmall" style={{ color: theme.colors.onBackground }}>
                My cycles vary
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Irregular, PCOS, perimenopause, or cycles that regularly differ by more than a week
              </Text>
            </View>
            <Switch
              value={isIrregular}
              onValueChange={setIsIrregular}
              color={theme.colors.primary}
            />
          </View>
        </Surface>

        {isIrregular ? (
          <>
            {/* Shortest cycle */}
            <View style={styles.section}>
              <Text variant="titleMedium" style={{ color: theme.colors.onBackground }}>
                Shortest cycle
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                The fewest days your cycle typically lasts
              </Text>
              <View style={styles.pickerRow}>
                {IRREGULAR_LENGTHS.map((len) => (
                  <Button
                    key={len}
                    mode={minCycle === len ? 'contained' : 'outlined'}
                    onPress={() => {
                      setMinCycle(len);
                      if (len >= maxCycle) setMaxCycle(len + 1);
                    }}
                    style={styles.pill}
                    compact
                  >
                    {String(len)}
                  </Button>
                ))}
              </View>
              <Text variant="bodyMedium" style={{ color: theme.colors.primary, fontWeight: '600' }}>
                {minCycle} days
              </Text>
            </View>

            {/* Longest cycle */}
            <View style={styles.section}>
              <Text variant="titleMedium" style={{ color: theme.colors.onBackground }}>
                Longest cycle
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                The most days your cycle typically lasts
              </Text>
              <View style={styles.pickerRow}>
                {IRREGULAR_LENGTHS.filter((l) => l > minCycle).map((len) => (
                  <Button
                    key={len}
                    mode={maxCycle === len ? 'contained' : 'outlined'}
                    onPress={() => setMaxCycle(len)}
                    style={styles.pill}
                    compact
                  >
                    {String(len)}
                  </Button>
                ))}
              </View>
              <Text variant="bodyMedium" style={{ color: theme.colors.primary, fontWeight: '600' }}>
                {maxCycle} days
              </Text>
            </View>

            <Surface style={[styles.infoCard, { backgroundColor: theme.colors.surfaceVariant }]} elevation={0}>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, lineHeight: 20 }}>
                Phases will be estimated using the midpoint of your range ({Math.round((minCycle + maxCycle) / 2)} days). Period predictions will show your full window rather than a single date.
              </Text>
            </Surface>
          </>
        ) : (
          /* Regular: single average */
          <View style={styles.section}>
            <Text variant="titleMedium" style={{ color: theme.colors.onBackground }}>
              Average cycle length
            </Text>
            <View style={styles.pickerRow}>
              {CYCLE_LENGTHS.map((len) => (
                <Button
                  key={len}
                  mode={cycleLength === len ? 'contained' : 'outlined'}
                  onPress={() => setCycleLength(len)}
                  style={styles.pill}
                  compact
                >
                  {String(len)}
                </Button>
              ))}
            </View>
            <Text variant="bodyMedium" style={{ color: theme.colors.primary, fontWeight: '600' }}>
              {cycleLength} days
            </Text>
          </View>
        )}

        {/* Period duration — always shown */}
        <View style={styles.section}>
          <Text variant="titleMedium" style={{ color: theme.colors.onBackground }}>
            Average period duration
          </Text>
          <View style={styles.pickerRow}>
            {PERIOD_DURATIONS.map((d) => (
              <Button
                key={d}
                mode={periodDuration === d ? 'contained' : 'outlined'}
                onPress={() => setPeriodDuration(d)}
                style={styles.pill}
                compact
              >
                {String(d)}
              </Button>
            ))}
          </View>
          <Text variant="bodyMedium" style={{ color: theme.colors.primary, fontWeight: '600' }}>
            {periodDuration} days
          </Text>
        </View>

      </ScrollView>

      <View style={styles.footer}>
        <Button
          mode="contained"
          onPress={handleSave}
          loading={saving}
          disabled={saving || (isIrregular && !rangeValid)}
          style={styles.button}
          contentStyle={styles.buttonContent}
        >
          Save Changes
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingTop: 8 },
  title: { fontWeight: '700', flex: 1 },
  scroll: { paddingHorizontal: 24, paddingTop: 24, gap: 28, paddingBottom: 16 },
  toggleCard: { borderRadius: 16, padding: 16 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  toggleText: { flex: 1, gap: 4 },
  section: { gap: 12 },
  pickerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  pill: { minWidth: 52, borderRadius: 20 },
  infoCard: { borderRadius: 12, padding: 14 },
  footer: { padding: 24, paddingBottom: 32 },
  button: { borderRadius: 28 },
  buttonContent: { paddingVertical: 8 },
});
