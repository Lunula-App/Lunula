import { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, useTheme, Switch, Surface } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const CYCLE_LENGTHS = [21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35];
const MIN_CYCLE_LENGTHS = [17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28];
const MAX_CYCLE_LENGTHS = [28, 30, 32, 35, 38, 40, 45, 50, 60];
const PERIOD_DURATIONS = [2, 3, 4, 5, 6, 7, 8];

export default function CycleInfoScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [cycleLength, setCycleLength] = useState(28);
  const [minCycleLength, setMinCycleLength] = useState(21);
  const [maxCycleLength, setMaxCycleLength] = useState(35);
  const [periodDuration, setPeriodDuration] = useState(5);
  const [isIrregular, setIsIrregular] = useState(false);

  const handleNext = () => {
    router.push({
      pathname: '/(auth)/onboarding/last-period',
      params: {
        cycleLength: String(cycleLength),
        periodDuration: String(periodDuration),
        isIrregular: isIrregular ? '1' : '0',
        minCycleLength: String(minCycleLength),
        maxCycleLength: String(maxCycleLength),
      },
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.onBackground }]}>
            Your Cycle
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            These help Lunula predict your phases accurately. You can adjust them later.
          </Text>
        </View>

        {/* Irregular toggle — shown first so it controls what follows */}
        <View style={[styles.section, styles.irregularRow]}>
          <View style={{ flex: 1, gap: 4 }}>
            <Text variant="titleMedium" style={{ color: theme.colors.onBackground }}>
              My cycles are irregular
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Lengths vary noticeably from cycle to cycle
            </Text>
          </View>
          <Switch value={isIrregular} onValueChange={setIsIrregular} />
        </View>

        {isIrregular ? (
          <>
            {/* Irregular: shortest + longest pickers */}
            <Surface style={[styles.irregularNote, { backgroundColor: theme.colors.primaryContainer }]} elevation={0}>
              <MaterialCommunityIcons name="information-outline" size={16} color={theme.colors.primary} />
              <Text variant="bodySmall" style={{ color: theme.colors.onPrimaryContainer, flex: 1, lineHeight: 20 }}>
                Lunula will show a prediction window rather than a fixed date, and refine it as you log more cycles.
              </Text>
            </Surface>

            <View style={styles.section}>
              <Text variant="titleMedium" style={{ color: theme.colors.onBackground }}>
                Shortest cycle
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
                The fewest days your cycle typically lasts
              </Text>
              <View style={styles.pickerRow}>
                {MIN_CYCLE_LENGTHS.map((len) => (
                  <Button
                    key={len}
                    mode={minCycleLength === len ? 'contained' : 'outlined'}
                    onPress={() => {
                      setMinCycleLength(len);
                      if (len >= maxCycleLength) setMaxCycleLength(Math.min(len + 7, 60));
                    }}
                    style={styles.pill}
                    labelStyle={styles.pillLabel}
                    compact
                  >
                    {String(len)}
                  </Button>
                ))}
              </View>
              <Text variant="bodyMedium" style={[styles.selectedLabel, { color: theme.colors.primary }]}>
                {minCycleLength} days
              </Text>
            </View>

            <View style={styles.section}>
              <Text variant="titleMedium" style={{ color: theme.colors.onBackground }}>
                Longest cycle
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
                The most days your cycle typically lasts
              </Text>
              <View style={styles.pickerRow}>
                {MAX_CYCLE_LENGTHS.filter((len) => len > minCycleLength).map((len) => (
                  <Button
                    key={len}
                    mode={maxCycleLength === len ? 'contained' : 'outlined'}
                    onPress={() => setMaxCycleLength(len)}
                    style={styles.pill}
                    labelStyle={styles.pillLabel}
                    compact
                  >
                    {String(len)}
                  </Button>
                ))}
              </View>
              <Text variant="bodyMedium" style={[styles.selectedLabel, { color: theme.colors.primary }]}>
                {maxCycleLength} days
              </Text>
            </View>
          </>
        ) : (
          /* Regular: single average picker */
          <View style={styles.section}>
            <Text variant="titleMedium" style={{ color: theme.colors.onBackground }}>
              Average cycle length
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
              Day 1 of your period to Day 1 of the next
            </Text>
            <View style={styles.pickerRow}>
              {CYCLE_LENGTHS.map((len) => (
                <Button
                  key={len}
                  mode={cycleLength === len ? 'contained' : 'outlined'}
                  onPress={() => setCycleLength(len)}
                  style={styles.pill}
                  labelStyle={styles.pillLabel}
                  compact
                >
                  {String(len)}
                </Button>
              ))}
            </View>
            <Text variant="bodyMedium" style={[styles.selectedLabel, { color: theme.colors.primary }]}>
              {cycleLength} days
            </Text>
          </View>
        )}

        <View style={styles.section}>
          <Text variant="titleMedium" style={{ color: theme.colors.onBackground }}>
            Average period duration
          </Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
            How many days your period typically lasts
          </Text>
          <View style={styles.pickerRow}>
            {PERIOD_DURATIONS.map((d) => (
              <Button
                key={d}
                mode={periodDuration === d ? 'contained' : 'outlined'}
                onPress={() => setPeriodDuration(d)}
                style={styles.pill}
                labelStyle={styles.pillLabel}
                compact
              >
                {String(d)}
              </Button>
            ))}
          </View>
          <Text variant="bodyMedium" style={[styles.selectedLabel, { color: theme.colors.primary }]}>
            {periodDuration} days
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          mode="contained"
          onPress={handleNext}
          style={styles.button}
          contentStyle={styles.buttonContent}
        >
          Next
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 16, gap: 32 },
  header: { gap: 8 },
  title: { fontWeight: '700' },
  section: { gap: 12 },
  irregularRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  irregularNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderRadius: 12,
    padding: 12,
  },
  pickerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  pill: { minWidth: 52, borderRadius: 20 },
  pillLabel: { fontSize: 13 },
  selectedLabel: { fontWeight: '600', marginTop: 4 },
  footer: { padding: 24, paddingBottom: 32 },
  button: { borderRadius: 28 },
  buttonContent: { paddingVertical: 8 },
});
