import { useState, useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Button, useTheme, Surface, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect, useNavigation } from 'expo-router';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
import { useSettingsStore } from '../../../src/stores/settingsStore';
import { computePrediction } from '../../../src/services/cycleEngine';
import { getExerciseById } from '../../../src/content/exercises/definitions';
import { saveExerciseSession } from '../../../src/db/repositories/exerciseRepository';
import { todayDate } from '../../../src/db/client';
import { syncNotifications } from '../../../src/services/notificationService';
import PulsingCircle from '../../../src/components/exercises/PulsingCircle';
import { CyclePhase } from '../../../src/models/cycle';
import { PHASE_COLORS } from '../../../src/theme/colors';

type SessionState = 'preview' | 'running' | 'complete';
type AnimPhase = 'hold' | 'relax' | 'rest' | 'idle';

export default function ExercisePlayerScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { exerciseId } = useLocalSearchParams<{ exerciseId: string }>();
  const { settings } = useSettingsStore();

  const exercise = getExerciseById(exerciseId ?? '');
  const currentPhase: CyclePhase = settings && settings.avgCycleLength >= 21
    ? computePrediction(settings).currentPhase
    : 'follicular';

  const [sessionState, setSessionState] = useState<SessionState>('preview');
  const [currentSet, setCurrentSet] = useState(1);
  const [currentRep, setCurrentRep] = useState(1);
  const [animPhase, setAnimPhase] = useState<AnimPhase>('idle');
  const [countdown, setCountdown] = useState(0);
  const [setsCompleted, setSetsCompleted] = useState(0);
  const [startTime, setStartTime] = useState<number>(0);
  const [audioEnabled, setAudioEnabled] = useState(
    settings?.exerciseAudioCues ?? false
  );

  const navigation = useNavigation();

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Mirrors of timer-driven state kept in refs so pause/resume reads are always current
  const animPhaseRef = useRef<AnimPhase>('idle');
  const countdownRef = useRef(0);
  const currentRepRef = useRef(1);
  const currentSetRef = useRef(1);

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // Speak phase cues whenever animPhase transitions (only while audio is enabled)
  const prevAnimPhaseRef = useRef<AnimPhase>('idle');
  useEffect(() => {
    if (animPhase === prevAnimPhaseRef.current) return;
    prevAnimPhaseRef.current = animPhase;
    if (!audioEnabled) return;

    const cue =
      animPhase === 'hold' ? 'Squeeze' :
      animPhase === 'relax' ? 'Release' :
      animPhase === 'rest' ? 'Rest' : null;

    if (!cue) return;

    void (async () => {
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
      await Speech.stop();
      Speech.speak(cue, { rate: 0.9 });
    })();
  }, [animPhase, audioEnabled, exercise]);

  // Speak completion cue
  useEffect(() => {
    if (sessionState === 'complete' && audioEnabled) {
      void (async () => {
        await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
        await Speech.stop();
        Speech.speak('Well done', { rate: 0.9 });
      })();
    }
  }, [sessionState, audioEnabled]);

  // Stop speech when audio is toggled off or screen unmounts
  useEffect(() => {
    if (!audioEnabled) Speech.stop();
  }, [audioEnabled]);

  useEffect(() => () => { Speech.stop(); }, []);

  const runRep = useCallback(
    (rep: number, set: number) => {
      if (!exercise) return;
      clearTimer();

      const repHoldMs = exercise.holdDurations?.[rep - 1] ?? exercise.holdDurationMs;
      const holdSec = Math.round(repHoldMs / 1000);
      const relaxSec = Math.round(exercise.relaxDurationMs / 1000);

      animPhaseRef.current = 'hold'; setAnimPhase('hold');
      countdownRef.current = holdSec; setCountdown(holdSec);
      currentRepRef.current = rep;   setCurrentRep(rep);
      currentSetRef.current = set;   setCurrentSet(set);

      let remaining = holdSec;
      timerRef.current = setInterval(() => {
        remaining -= 1;
        countdownRef.current = remaining;
        setCountdown(remaining);
        if (remaining <= 0) {
          clearTimer();

          if (rep >= exercise.reps) {
            if (set >= exercise.sets) {
              animPhaseRef.current = 'idle'; setAnimPhase('idle');
              setSetsCompleted(set);
              setSessionState('complete');
            } else {
              const setRestSec = Math.round(exercise.setRestDurationMs / 1000);
              animPhaseRef.current = 'rest'; setAnimPhase('rest');
              let restRemaining = setRestSec;
              countdownRef.current = restRemaining; setCountdown(restRemaining);
              timerRef.current = setInterval(() => {
                restRemaining -= 1;
                countdownRef.current = restRemaining;
                setCountdown(restRemaining);
                if (restRemaining <= 0) {
                  clearTimer();
                  runRep(1, set + 1);
                }
              }, 1000);
            }
          } else {
            animPhaseRef.current = 'relax'; setAnimPhase('relax');
            let relaxRemaining = relaxSec;
            countdownRef.current = relaxRemaining; setCountdown(relaxRemaining);
            timerRef.current = setInterval(() => {
              relaxRemaining -= 1;
              countdownRef.current = relaxRemaining;
              setCountdown(relaxRemaining);
              if (relaxRemaining <= 0) {
                clearTimer();
                runRep(rep + 1, set);
              }
            }, 1000);
          }
        }
      }, 1000);
    },
    [exercise]
  );

  function handleStart() {
    savedRef.current = false;
    setSessionState('running');
    setStartTime(Date.now());
    runRep(1, 1);
  }

  function handleSkipRest() {
    if (animPhase !== 'rest') return;
    clearTimer();
    runRep(1, currentSet + 1);
  }

  function handleStop() {
    savedRef.current = true; // prevent auto-save after explicitly stopping
    clearTimer();
    setAnimPhase('idle');
    setSessionState('preview');
    setCurrentRep(1);
    setCurrentSet(1);
  }

  // Resumes the current phase from where the timer was paused, reading from refs
  // so values are always current regardless of closure age.
  function resumeCurrentPhase() {
    if (!exercise) return;
    clearTimer();
    const phase = animPhaseRef.current;
    const remainingSecs = countdownRef.current;
    const rep = currentRepRef.current;
    const set = currentSetRef.current;

    if (phase === 'relax') {
      let remaining = remainingSecs;
      timerRef.current = setInterval(() => {
        remaining -= 1;
        countdownRef.current = remaining;
        setCountdown(remaining);
        if (remaining <= 0) { clearTimer(); runRep(rep + 1, set); }
      }, 1000);
      return;
    }

    if (phase === 'rest') {
      let remaining = remainingSecs;
      timerRef.current = setInterval(() => {
        remaining -= 1;
        countdownRef.current = remaining;
        setCountdown(remaining);
        if (remaining <= 0) { clearTimer(); runRep(1, set + 1); }
      }, 1000);
      return;
    }

    // hold phase — duplicate the hold→relax/rest/complete transition logic
    let remaining = remainingSecs;
    timerRef.current = setInterval(() => {
      remaining -= 1;
      countdownRef.current = remaining;
      setCountdown(remaining);
      if (remaining <= 0) {
        clearTimer();
        if (rep >= exercise.reps) {
          if (set >= exercise.sets) {
            animPhaseRef.current = 'idle'; setAnimPhase('idle');
            setSetsCompleted(set);
            setSessionState('complete');
          } else {
            const setRestSec = Math.round(exercise.setRestDurationMs / 1000);
            animPhaseRef.current = 'rest'; setAnimPhase('rest');
            let restRemaining = setRestSec;
            countdownRef.current = restRemaining; setCountdown(restRemaining);
            timerRef.current = setInterval(() => {
              restRemaining -= 1;
              countdownRef.current = restRemaining;
              setCountdown(restRemaining);
              if (restRemaining <= 0) { clearTimer(); runRep(1, set + 1); }
            }, 1000);
          }
        } else {
          const relaxSec = Math.round(exercise.relaxDurationMs / 1000);
          animPhaseRef.current = 'relax'; setAnimPhase('relax');
          let relaxRemaining = relaxSec;
          countdownRef.current = relaxRemaining; setCountdown(relaxRemaining);
          timerRef.current = setInterval(() => {
            relaxRemaining -= 1;
            countdownRef.current = relaxRemaining;
            setCountdown(relaxRemaining);
            if (relaxRemaining <= 0) { clearTimer(); runRep(rep + 1, set); }
          }, 1000);
        }
      }
    }, 1000);
  }

  const savedRef = useRef(false);

  async function saveSession() {
    if (savedRef.current || !exercise || sessionState !== 'complete') return;
    savedRef.current = true;
    const duration = Math.round((Date.now() - startTime) / 1000);
    await saveExerciseSession({
      date: todayDate(),
      exerciseId: exercise.id,
      setsCompleted,
      repsCompleted: setsCompleted * exercise.reps,
      durationSeconds: duration,
      notes: null,
    });
    const currentSettings = useSettingsStore.getState().settings;
    if (currentSettings) {
      syncNotifications(currentSettings, { kegel: true }).catch(() => {});
    }
  }

  async function handleFinish() {
    await saveSession();
    router.navigate('/(app)/exercises');
  }

  // Auto-save if the user navigates away while on the complete screen
  useFocusEffect(
    useCallback(() => {
      return () => {
        if (sessionState === 'complete') {
          saveSession();
        }
      };
    }, [sessionState, exercise, setsCompleted, startTime])
  );

  // Intercept back-navigation while an exercise is running
  useEffect(() => {
    const unsubscribe = (navigation as any).addListener('beforeRemove', (e: any) => {
      if (sessionState !== 'running') return;
      e.preventDefault();
      clearTimer();
      Alert.alert(
        'Leave exercise?',
        'Your current set will be lost.',
        [
          {
            text: 'Keep Going',
            style: 'cancel',
            onPress: resumeCurrentPhase,
          },
          {
            text: 'Leave',
            style: 'destructive',
            onPress: () => {
              handleStop();
              (navigation as any).dispatch(e.data.action);
            },
          },
        ]
      );
    });
    return unsubscribe;
  }, [navigation, sessionState]);

  useEffect(() => () => clearTimer(), []);

  if (!exercise) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text>Exercise not found.</Text>
      </SafeAreaView>
    );
  }

  const phaseColor = PHASE_COLORS[currentPhase];
  const cue =
    animPhase === 'hold' ? exercise.breathingCue :
    animPhase === 'relax' ? exercise.relaxCue :
    animPhase === 'rest' ? 'Take a breath — next set coming up' :
    'Ready?';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Button
          mode="text"
          onPress={() => router.back()}
          icon="arrow-left"
        >
          Back
        </Button>
        <Text variant="titleMedium" style={[styles.headerTitle, { color: theme.colors.onBackground }]}>
          {exercise.name}
        </Text>
      </View>

      {sessionState === 'preview' && (
        <ScrollView contentContainerStyle={styles.previewScroll}>
          <Text variant="bodyMedium" style={[styles.desc, { color: theme.colors.onSurface }]}>
            {exercise.description}
          </Text>

          <View style={styles.statsGrid}>
            <StatBox label="Sets" value={String(exercise.sets)} color={phaseColor} />
            <StatBox label="Reps" value={String(exercise.reps)} color={phaseColor} />
            <StatBox label="Hold" value={`${Math.round(exercise.holdDurationMs / 1000)}s`} color={phaseColor} />
            <StatBox label="Relax" value={`${Math.round(exercise.relaxDurationMs / 1000)}s`} color={phaseColor} />
          </View>

          {exercise.benefits.length > 0 && (
            <Surface style={[styles.infoCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
              <Text variant="titleSmall" style={[styles.infoLabel, { color: theme.colors.onSurfaceVariant }]}>
                BENEFITS
              </Text>
              {exercise.benefits.map((b) => (
                <Text key={b} variant="bodySmall" style={{ color: theme.colors.onSurface }}>
                  • {b}
                </Text>
              ))}
            </Surface>
          )}

          {exercise.contraindications.length > 0 && (
            <Surface style={[styles.infoCard, { backgroundColor: theme.colors.errorContainer ?? '#FDECEA' }]} elevation={0}>
              <Text variant="titleSmall" style={[styles.infoLabel, { color: theme.colors.error }]}>
                NOTES
              </Text>
              {exercise.contraindications.map((c) => (
                <Text key={c} variant="bodySmall" style={{ color: theme.colors.onSurface }}>
                  ⚠ {c}
                </Text>
              ))}
            </Surface>
          )}

          <Button
            mode="contained"
            onPress={handleStart}
            style={styles.startBtn}
            contentStyle={styles.startBtnContent}
          >
            Start Exercise
          </Button>
        </ScrollView>
      )}

      {sessionState === 'running' && (
        <View style={styles.runningContainer}>
          <View style={styles.runningHeader}>
            <Text variant="labelMedium" style={[styles.setLabel, { color: theme.colors.onSurfaceVariant }]}>
              {animPhase === 'rest'
                ? `REST — SET ${currentSet} OF ${exercise.sets} COMPLETE`
                : `SET ${currentSet} OF ${exercise.sets}`}
            </Text>
            <IconButton
              icon={audioEnabled ? 'volume-high' : 'volume-off'}
              size={20}
              iconColor={audioEnabled ? theme.colors.primary : theme.colors.onSurfaceVariant}
              onPress={() => setAudioEnabled((v) => !v)}
              style={styles.audioToggle}
            />
          </View>

          <PulsingCircle
            phase={animPhase}
            cyclePhase={currentPhase}
            holdDurationMs={exercise.holdDurations?.[currentRep - 1] ?? exercise.holdDurationMs}
            relaxDurationMs={exercise.relaxDurationMs}
            cue={cue}
            countdown={countdown}
            rep={currentRep}
            totalReps={exercise.reps}
          />

          {animPhase === 'rest' && (
            <Button
              mode="contained-tonal"
              onPress={handleSkipRest}
              style={styles.skipBtn}
            >
              Skip Rest
            </Button>
          )}

          <Button
            mode="outlined"
            onPress={handleStop}
            style={styles.stopBtn}
          >
            Stop
          </Button>
        </View>
      )}

      {sessionState === 'complete' && (
        <View style={styles.completeContainer}>
          <Text style={styles.completeEmoji}>🎉</Text>
          <Text variant="headlineSmall" style={{ color: theme.colors.onBackground, fontWeight: '700' }}>
            Well done!
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
            You completed {setsCompleted} {setsCompleted === 1 ? 'set' : 'sets'} of{' '}
            {exercise.name}.
          </Text>
          <Button
            mode="contained"
            onPress={handleFinish}
            style={styles.startBtn}
            contentStyle={styles.startBtnContent}
          >
            Save & Finish
          </Button>
          <Button mode="text" onPress={handleStop}>
            Do Again
          </Button>
        </View>
      )}
    </SafeAreaView>
  );
}

function StatBox({ label, value, color }: { label: string; value: string; color: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.statBox, { backgroundColor: color + '22', borderColor: color + '44' }]}>
      <Text variant="bodyLarge" style={{ color, fontWeight: '700' }}>
        {value}
      </Text>
      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingTop: 8 },
  headerTitle: { flex: 1, fontWeight: '600' },
  previewScroll: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40, gap: 16 },
  desc: { lineHeight: 24 },
  statsGrid: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  statBox: { flex: 1, minWidth: '40%', borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1 },
  infoCard: { borderRadius: 16, padding: 16, gap: 8 },
  infoLabel: { fontWeight: '700', letterSpacing: 0.8 },
  startBtn: { borderRadius: 28, marginTop: 8 },
  startBtnContent: { paddingVertical: 8 },
  runningContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 40 },
  runningHeader: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  setLabel: { fontWeight: '700', letterSpacing: 1 },
  audioToggle: { margin: 0 },
  skipBtn: { borderRadius: 28, minWidth: 140 },
  stopBtn: { borderRadius: 28, minWidth: 140 },
  completeContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, paddingHorizontal: 32 },
  completeEmoji: { fontSize: 72 },
});
