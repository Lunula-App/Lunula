import { useMemo, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Text, useTheme, Surface, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSettingsStore } from '../../../src/stores/settingsStore';
import { computePrediction } from '../../../src/services/cycleEngine';
import { getExercisesForPhase, EXERCISES } from '../../../src/content/exercises/definitions';
import { getSessionsForDate } from '../../../src/db/repositories/exerciseRepository';
import { todayDate } from '../../../src/db/client';
import { useExerciseStore } from '../../../src/stores/exerciseStore';
import { ExerciseDefinition } from '../../../src/models/exercise';
import { PHASE_COLORS } from '../../../src/theme/colors';
import { CyclePhase } from '../../../src/models/cycle';
import { getUserProgressionLevel, progressionLevelLabel, ProgressionLevel } from '../../../src/services/progressionService';

const DIFFICULTY_COLORS = {
  beginner: '#4CAF50',
  intermediate: '#FF9800',
  advanced: '#F44336',
};

const tutorial = EXERCISES.find((e) => e.id === 'tut-01')!;

export default function ExercisesScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { settings } = useSettingsStore();
  const [userLevel, setUserLevel] = useState<ProgressionLevel>(1);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const { streak, last7, sessionDates, load: loadStreak } = useExerciseStore();

  useFocusEffect(
    useCallback(() => {
      getSessionsForDate(todayDate()).then((sessions) => {
        setCompletedIds(new Set(sessions.map((s) => s.exerciseId)));
      });
      loadStreak();
      getUserProgressionLevel().then(setUserLevel);
    }, [])
  );

  const { phase, exercises } = useMemo(() => {
    if (!settings) return { phase: 'follicular' as CyclePhase, exercises: [] };
    const prediction = computePrediction(settings);
    const p = prediction.currentPhase;
    const all = getExercisesForPhase(p).filter((e) => e.type !== 'tutorial');
    const filtered = all.filter((e) => e.progressionLevel <= userLevel);
    return { phase: p, exercises: filtered };
  }, [settings, userLevel]);

  const phaseColor = PHASE_COLORS[phase as CyclePhase];

  function navTo(id: string) {
    router.push({ pathname: '/(app)/exercises/[exerciseId]', params: { exerciseId: id } });
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.onBackground }]}>
            Pelvic Floor
          </Text>
          <Chip
            style={[styles.phaseChip, { backgroundColor: phaseColor + '33' }]}
            textStyle={{ color: phaseColor }}
          >
            {phase.charAt(0).toUpperCase() + phase.slice(1)} Phase
          </Chip>
        </View>

        <Surface style={[styles.infoCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, lineHeight: 22 }}>
            {PHASE_EXERCISE_INFO[phase as CyclePhase]}
          </Text>
        </Surface>

        {/* Streak card */}
        <Surface style={[styles.streakCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <View style={styles.streakHeader}>
            <MaterialCommunityIcons name="fire" size={20} color={phaseColor} />
            <Text variant="titleSmall" style={{ color: theme.colors.onSurface, fontWeight: '700' }}>
              {streak === 0
                ? 'No streak yet — exercise today to start one'
                : streak === 1
                ? '1 day streak — keep it going!'
                : `${streak} day streak`}
            </Text>
          </View>
          <View style={styles.dotsRow}>
            {last7.map((date, i) => {
              const done = sessionDates.has(date);
              const isToday = i === 6;
              return (
                <View key={date} style={styles.dotCol}>
                  <View
                    style={[
                      styles.streakDot,
                      {
                        backgroundColor: done ? phaseColor : theme.colors.surfaceVariant,
                        borderColor: isToday ? phaseColor : 'transparent',
                        borderWidth: isToday ? 2 : 0,
                      },
                    ]}
                  />
                  <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, fontSize: 9 }}>
                    {['M', 'T', 'W', 'T', 'F', 'S', 'S'][new Date(date + 'T00:00:00').getDay() === 0 ? 6 : new Date(date + 'T00:00:00').getDay() - 1]}
                  </Text>
                </View>
              );
            })}
          </View>
        </Surface>

        {/* Tutorial card — hidden once completed */}
        {!completedIds.has(tutorial.id) && (
          <>
            <Text variant="titleSmall" style={[styles.sectionLabel, { color: theme.colors.onSurfaceVariant }]}>
              NEW HERE?
            </Text>
            <ExerciseCard exercise={tutorial} phaseColor="#78909C" onPress={() => navTo(tutorial.id)} completed={false} />
          </>
        )}

        {/* Progression level + exercises header */}
        <View style={styles.sectionRow}>
          <Text variant="titleSmall" style={[styles.sectionLabel, { color: theme.colors.onSurfaceVariant }]}>
            TODAY'S EXERCISES
          </Text>
          <Chip
            compact
            icon={() => (
              <MaterialCommunityIcons
                name={userLevel === 3 ? 'star' : userLevel === 2 ? 'star-half-full' : 'star-outline'}
                size={14}
                color={phaseColor}
              />
            )}
            style={{ backgroundColor: phaseColor + '22' }}
            textStyle={{ color: phaseColor, fontSize: 11 }}
          >
            {progressionLevelLabel(userLevel)}
          </Chip>
        </View>

        {exercises.map((ex) => (
          <ExerciseCard
            key={ex.id}
            exercise={ex}
            phaseColor={phaseColor}
            onPress={() => navTo(ex.id)}
            completed={completedIds.has(ex.id)}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function ExerciseCard({
  exercise,
  phaseColor,
  onPress,
  completed,
}: {
  exercise: ExerciseDefinition;
  phaseColor: string;
  onPress: () => void;
  completed: boolean;
}) {
  const theme = useTheme();
  const holdLabel = exercise.holdDurations
    ? `${Math.round(Math.min(...exercise.holdDurations) / 1000)}–${Math.round(Math.max(...exercise.holdDurations) / 1000)}s`
    : `${Math.round(exercise.holdDurationMs / 1000)}s`;
  const relaxSec = Math.round(exercise.relaxDurationMs / 1000);
  const DONE_COLOR = '#4CAF50';

  return (
    <Pressable onPress={onPress}>
      {({ pressed }) => (
        <Surface
          style={[
            styles.card,
            {
              backgroundColor: pressed ? theme.colors.surfaceVariant : theme.colors.surface,
              borderColor: completed ? DONE_COLOR + '66' : phaseColor + '44',
            },
          ]}
          elevation={1}
        >
          <View style={styles.cardHeader}>
            <View style={{ flex: 1 }}>
              <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: '600' }}>
                {exercise.name}
              </Text>
              <View style={styles.chipsRow}>
                <Chip
                  compact
                  style={[styles.diffChip, { backgroundColor: DIFFICULTY_COLORS[exercise.difficulty] + '22' }]}
                  textStyle={{ color: DIFFICULTY_COLORS[exercise.difficulty], fontSize: 11 }}
                >
                  {exercise.difficulty}
                </Chip>
                {completed && (
                  <Chip
                    compact
                    icon={() => <MaterialCommunityIcons name="check-circle" size={13} color={DONE_COLOR} />}
                    style={[styles.diffChip, { backgroundColor: DONE_COLOR + '22' }]}
                    textStyle={{ color: DONE_COLOR, fontSize: 11 }}
                  >
                    Done today
                  </Chip>
                )}
              </View>
            </View>
            <MaterialCommunityIcons
              name={completed ? 'check-circle' : 'chevron-right'}
              size={24}
              color={completed ? DONE_COLOR : theme.colors.onSurfaceVariant}
            />
          </View>

          <Text
            variant="bodySmall"
            style={{ color: theme.colors.onSurfaceVariant, lineHeight: 20 }}
            numberOfLines={2}
          >
            {exercise.description}
          </Text>

          <View style={styles.statsRow}>
            <StatBadge label="Sets" value={String(exercise.sets)} color={phaseColor} />
            <StatBadge label="Reps" value={String(exercise.reps)} color={phaseColor} />
            <StatBadge label="Hold" value={holdLabel} color={phaseColor} />
            <StatBadge label="Rest" value={`${relaxSec}s`} color={phaseColor} />
          </View>
        </Surface>
      )}
    </Pressable>
  );
}

function StatBadge({ label, value, color }: { label: string; value: string; color: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.badge, { backgroundColor: color + '22' }]}>
      <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
        {label}
      </Text>
      <Text variant="bodySmall" style={{ color, fontWeight: '700' }}>
        {value}
      </Text>
    </View>
  );
}

const PHASE_EXERCISE_INFO: Record<CyclePhase, string> = {
  menstrual:
    'During your period, the focus is on gentle release and relief. These exercises help ease cramps and relax pelvic tension rather than building strength.',
  follicular:
    'As estrogen rises, your tissues are more elastic and responsive. This is the ideal time to build strength and establish your baseline.',
  ovulatory:
    'Peak estrogen means peak elasticity. Today\'s exercises target fast-twitch fibers and coordination — the most dynamic phase of the programme.',
  luteal:
    'Progesterone loosens ligaments. Focus on stability, controlled movement, and releasing tension to prepare your body for the next cycle.',
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32, gap: 14 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 },
  title: { fontWeight: '700' },
  phaseChip: {},
  infoCard: { borderRadius: 16, padding: 16 },
  streakCard: { borderRadius: 16, padding: 16, gap: 12 },
  streakHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dotsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dotCol: { alignItems: 'center', gap: 4, flex: 1 },
  streakDot: { width: 28, height: 28, borderRadius: 14 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 },
  sectionLabel: { fontWeight: '700', letterSpacing: 0.8 },
  card: { borderRadius: 16, padding: 16, gap: 10, borderWidth: 1.5 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  chipsRow: { flexDirection: 'row', gap: 6, marginTop: 4, flexWrap: 'wrap' },
  diffChip: { alignSelf: 'flex-start' },
  statsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, alignItems: 'center', minWidth: 52 },
});
