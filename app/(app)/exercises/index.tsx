import { useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Text, useTheme, Surface, Chip, SegmentedButtons } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useSettingsStore } from '../../../src/stores/settingsStore';
import { computePrediction } from '../../../src/services/cycleEngine';
import { getExercisesForPhase, EXERCISES } from '../../../src/content/exercises/definitions';
import { ExerciseDefinition } from '../../../src/models/exercise';
import { PHASE_COLORS } from '../../../src/theme/colors';
import { CyclePhase } from '../../../src/models/cycle';

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
  const [level, setLevel] = useState<'beginner' | 'all'>('all');

  const { phase, exercises } = useMemo(() => {
    if (!settings) return { phase: 'follicular' as CyclePhase, exercises: [] };
    const prediction = computePrediction(settings);
    const p = prediction.currentPhase;
    const all = getExercisesForPhase(p).filter((e) => e.type !== 'tutorial');
    const filtered = level === 'beginner' ? all.filter((e) => e.difficulty === 'beginner') : all;
    return { phase: p, exercises: filtered };
  }, [settings, level]);

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

        {/* Tutorial card — always visible */}
        <Text variant="titleSmall" style={[styles.sectionLabel, { color: theme.colors.onSurfaceVariant }]}>
          NEW HERE?
        </Text>
        <ExerciseCard exercise={tutorial} phaseColor="#78909C" onPress={() => navTo(tutorial.id)} />

        {/* Level filter */}
        <Text variant="titleSmall" style={[styles.sectionLabel, { color: theme.colors.onSurfaceVariant }]}>
          TODAY'S EXERCISES
        </Text>
        <SegmentedButtons
          value={level}
          onValueChange={(v) => setLevel(v as 'beginner' | 'all')}
          buttons={[
            { value: 'beginner', label: 'Beginner' },
            { value: 'all', label: 'All levels' },
          ]}
          style={styles.segmented}
        />

        {exercises.map((ex) => (
          <ExerciseCard
            key={ex.id}
            exercise={ex}
            phaseColor={phaseColor}
            onPress={() => navTo(ex.id)}
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
}: {
  exercise: ExerciseDefinition;
  phaseColor: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  const holdSec = Math.round(exercise.holdDurationMs / 1000);
  const relaxSec = Math.round(exercise.relaxDurationMs / 1000);

  return (
    <Pressable onPress={onPress}>
      {({ pressed }) => (
        <Surface
          style={[
            styles.card,
            {
              backgroundColor: pressed ? theme.colors.surfaceVariant : theme.colors.surface,
              borderColor: phaseColor + '44',
            },
          ]}
          elevation={1}
        >
          <View style={styles.cardHeader}>
            <View style={{ flex: 1 }}>
              <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: '600' }}>
                {exercise.name}
              </Text>
              <Chip
                compact
                style={[styles.diffChip, { backgroundColor: DIFFICULTY_COLORS[exercise.difficulty] + '22' }]}
                textStyle={{ color: DIFFICULTY_COLORS[exercise.difficulty], fontSize: 11 }}
              >
                {exercise.difficulty}
              </Chip>
            </View>
            <Text style={styles.arrowIcon}>›</Text>
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
            <StatBadge label="Hold" value={`${holdSec}s`} color={phaseColor} />
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
  sectionLabel: { fontWeight: '700', letterSpacing: 0.8, paddingHorizontal: 4 },
  segmented: { marginBottom: 4 },
  card: { borderRadius: 16, padding: 16, gap: 10, borderWidth: 1.5 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  diffChip: { alignSelf: 'flex-start', marginTop: 4 },
  arrowIcon: { fontSize: 24, color: '#9E9E9E', lineHeight: 32 },
  statsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, alignItems: 'center', minWidth: 52 },
});
