import { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, useTheme, Surface, Chip, FAB } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';
import { useSettingsStore } from '../../../src/stores/settingsStore';
import { useLogStore } from '../../../src/stores/logStore';
import { computePrediction } from '../../../src/services/cycleEngine';
import { CyclePrediction } from '../../../src/models/cycle';
import { MOOD_LABELS, FLOW_LABELS } from '../../../src/models/log';
import PhaseCard from '../../../src/components/common/PhaseCard';

const ENERGY_LABELS: Record<number, string> = { 1: 'Low', 2: 'Moderate', 3: 'High' };
import { PHASE_DESCRIPTIONS } from '../../../src/models/cycle';
import { PHASE_COLORS } from '../../../src/theme/colors';
import { todayDate } from '../../../src/db/client';

export default function TodayScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { settings } = useSettingsStore();
  const { todayLog, loadToday } = useLogStore();
  const [prediction, setPrediction] = useState<CyclePrediction | null>(null);

  useEffect(() => {
    loadToday();
  }, []);

  useEffect(() => {
    if (settings) {
      setPrediction(computePrediction(settings));
    }
  }, [settings]);

  const today = new Date();
  const dateLabel = format(today, 'EEEE, d MMMM');

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            {dateLabel}
          </Text>
          <Text variant="headlineMedium" style={[styles.greeting, { color: theme.colors.onBackground }]}>
            Good {getTimeOfDay()}
          </Text>
        </View>

        {/* Phase Card */}
        {prediction && <PhaseCard prediction={prediction} />}

        {/* Phase description */}
        {prediction && (
          <Surface style={[styles.descCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, lineHeight: 22 }}>
              {PHASE_DESCRIPTIONS[prediction.currentPhase]}
            </Text>
          </Surface>
        )}

        {/* Upcoming events */}
        {prediction && (
          <View style={styles.section}>
            <Text variant="titleSmall" style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant }]}>
              UPCOMING
            </Text>
            {!prediction.isIrregular && (
              <View style={styles.eventRow}>
                <EventChip
                  label={`Ovulation window starts ${formatUpcoming(prediction.ovulationWindowStart)}`}
                  icon="seed-outline"
                  color={theme.colors.secondary}
                />
              </View>
            )}
            <View style={styles.eventRow}>
              {prediction.isIrregular ? (
                prediction.daysUntilEarliest !== null && prediction.daysUntilLatest !== null ? (
                  <EventChip
                    label={`Next period: ${prediction.daysUntilEarliest}–${prediction.daysUntilLatest} days away`}
                    icon="calendar-range"
                    color={PHASE_COLORS.menstrual}
                  />
                ) : (
                  <EventChip
                    label="Next period timing varies — log more cycles to narrow this down"
                    icon="calendar-range"
                    color={PHASE_COLORS.menstrual}
                  />
                )
              ) : (
                <EventChip
                  label={`Next period ${formatUpcoming(prediction.nextPeriodDate)}`}
                  icon="calendar-month-outline"
                  color={PHASE_COLORS.menstrual}
                />
              )}
            </View>
          </View>
        )}

        {/* Today's log summary */}
        <View style={styles.section}>
          <Text variant="titleSmall" style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant }]}>
            TODAY'S LOG
          </Text>
          {todayLog ? (
            <Surface style={[styles.logCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
              {todayLog.isPeriodDay && (
                <Chip icon="water" style={styles.chip}>
                  Period — {FLOW_LABELS[todayLog.flowIntensity]}
                </Chip>
              )}
              {todayLog.moods.length > 0 && (
                <Text variant="bodyMedium">
                  {todayLog.moods.map((m) => MOOD_LABELS[m]).join(', ')}
                </Text>
              )}
              {todayLog.energyLevel && (
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  Energy: {ENERGY_LABELS[todayLog.energyLevel]}
                </Text>
              )}
              {todayLog.symptoms.length > 0 && (
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  Symptoms: {todayLog.symptoms.join(', ')}
                </Text>
              )}
              <Button
                mode="text"
                onPress={() => router.push('/(app)/today/log-entry')}
                style={{ alignSelf: 'flex-start', marginTop: 4 }}
              >
                Edit log
              </Button>
            </Surface>
          ) : (
            <Surface style={[styles.logCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                You haven't logged today yet.
              </Text>
              <Button
                mode="contained-tonal"
                onPress={() => router.push('/(app)/today/log-entry')}
                style={{ marginTop: 12, alignSelf: 'flex-start' }}
              >
                Log Now
              </Button>
            </Surface>
          )}
        </View>
      </ScrollView>

      <FAB
        icon="plus"
        label="Log Today"
        onPress={() => router.push('/(app)/today/log-entry')}
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        color={theme.colors.onPrimary}
      />
    </SafeAreaView>
  );
}

function EventChip({ label, icon, color }: { label: string; icon: string; color: string }) {
  return (
    <View style={[styles.eventChip, { borderColor: color + '44', backgroundColor: color + '11' }]}>
      <MaterialCommunityIcons name={icon as any} size={18} color={color} />
      <Text variant="bodySmall" style={{ color, flex: 1 }}>{label}</Text>
    </View>
  );
}

function getTimeOfDay(): string {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

function formatUpcoming(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const diff = Math.ceil((date.getTime() - today.getTime()) / 86400000);
  if (diff <= 0) return 'today';
  if (diff === 1) return 'tomorrow';
  if (diff <= 7) return `in ${diff} days`;
  return format(date, 'd MMM');
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 100, gap: 20 },
  header: { gap: 4 },
  greeting: { fontWeight: '700' },
  descCard: { borderRadius: 16, padding: 16 },
  section: { gap: 10 },
  sectionTitle: { fontWeight: '700', letterSpacing: 0.8 },
  logCard: { borderRadius: 16, padding: 16, gap: 8 },
  chip: { alignSelf: 'flex-start' },
  eventRow: {},
  eventChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    borderRadius: 28,
  },
});
