import { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Text, Button, useTheme, Surface, Chip, FAB } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { format } from 'date-fns';
import { useSettingsStore } from '../../../src/stores/settingsStore';
import { useLogStore } from '../../../src/stores/logStore';
import { useExerciseStore } from '../../../src/stores/exerciseStore';
import { computePrediction } from '../../../src/services/cycleEngine';
import { CyclePrediction } from '../../../src/models/cycle';
import { MOOD_LABELS, FLOW_LABELS } from '../../../src/models/log';
import PhaseCard from '../../../src/components/common/PhaseCard';
import { getSessionsForDate } from '../../../src/db/repositories/exerciseRepository';

const ENERGY_LABELS: Record<number, string> = { 1: 'Low', 2: 'Moderate', 3: 'High' };
import { PHASE_COLORS } from '../../../src/theme/colors';
import { todayDate } from '../../../src/db/client';

export default function TodayScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { settings } = useSettingsStore();
  const { todayLog, loadToday } = useLogStore();
  const { streak, load: loadStreak } = useExerciseStore();
  const [prediction, setPrediction] = useState<CyclePrediction | null>(null);
  const [exercisedToday, setExercisedToday] = useState(false);

  useEffect(() => {
    if (settings) {
      setPrediction(computePrediction(settings));
    }
  }, [settings]);

  useFocusEffect(
    useCallback(() => {
      loadToday();
      loadStreak();
      getSessionsForDate(todayDate()).then((sessions) => {
        setExercisedToday(sessions.length > 0);
      });
    }, [])
  );

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

        {/* Exercise widget */}
        {prediction && (
          <View style={styles.section}>
            <Text variant="titleSmall" style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant }]}>
              PELVIC FLOOR
            </Text>
            <Pressable onPress={() => router.push('/(app)/exercises')}>
              {({ pressed }) => {
                const phaseColor = PHASE_COLORS[prediction.currentPhase];
                return (
                  <Surface
                    style={[
                      styles.exerciseCard,
                      {
                        backgroundColor: pressed ? theme.colors.surfaceVariant : theme.colors.surface,
                        borderColor: exercisedToday ? '#4CAF50' + '55' : phaseColor + '33',
                      },
                    ]}
                    elevation={1}
                  >
                    <View style={styles.exerciseCardRow}>
                      <View style={[styles.exerciseIconWrap, { backgroundColor: exercisedToday ? '#4CAF50' + '22' : phaseColor + '22' }]}>
                        <MaterialCommunityIcons
                          name={exercisedToday ? 'check-circle' : 'yoga'}
                          size={22}
                          color={exercisedToday ? '#4CAF50' : phaseColor}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text variant="titleSmall" style={{ color: theme.colors.onSurface, fontWeight: '600' }}>
                          {exercisedToday ? 'Done for today' : 'Exercises ready'}
                        </Text>
                        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                          {exercisedToday
                            ? streak >= 2 ? `${streak} day streak — keep it going` : 'Great work today'
                            : `${prediction.currentPhase.charAt(0).toUpperCase() + prediction.currentPhase.slice(1)} phase exercises`}
                        </Text>
                      </View>
                      {streak >= 2 && (
                        <View style={styles.streakBadge}>
                          <MaterialCommunityIcons name="fire" size={14} color={phaseColor} />
                          <Text variant="labelSmall" style={{ color: phaseColor, fontWeight: '700' }}>
                            {streak}
                          </Text>
                        </View>
                      )}
                      <MaterialCommunityIcons name="chevron-right" size={20} color={theme.colors.onSurfaceVariant} />
                    </View>
                  </Surface>
                );
              }}
            </Pressable>
          </View>
        )}

        {/* Today's log summary */}
        <View style={styles.section}>
          <Text variant="titleSmall" style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant }]}>
            TODAY'S LOG
          </Text>
          {todayLog ? (
            <Surface style={[styles.logCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
              <View style={styles.logCardInner}>
                <View style={{ flex: 1, gap: 8 }}>
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
                </View>
                <MaterialCommunityIcons
                  name="notebook-edit-outline"
                  size={52}
                  color={theme.colors.primary}
                  style={{ opacity: 0.12, alignSelf: 'center' }}
                />
              </View>
            </Surface>
          ) : (
            <Surface style={[styles.logCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
              <View style={styles.logCardInner}>
                <View style={{ flex: 1 }}>
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
                </View>
                <MaterialCommunityIcons
                  name="notebook-outline"
                  size={52}
                  color={theme.colors.primary}
                  style={{ opacity: 0.12, alignSelf: 'center' }}
                />
              </View>
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
  section: { gap: 10 },
  sectionTitle: { fontWeight: '700', letterSpacing: 0.8 },
  logCard: { borderRadius: 16, padding: 16 },
  logCardInner: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingRight: 8 },
  exerciseCard: { borderRadius: 16, padding: 14, borderWidth: 1.5 },
  exerciseCardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  exerciseIconWrap: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  streakBadge: { flexDirection: 'row', alignItems: 'center', gap: 3 },
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
