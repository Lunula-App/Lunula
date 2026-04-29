import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, useTheme, Chip, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { format, parseISO } from 'date-fns';
import { useLogStore } from '../../../src/stores/logStore';
import { getLogForDate } from '../../../src/db/repositories/logRepository';
import { todayDate } from '../../../src/db/client';
import {
  FlowIntensity, DischargeType, Symptom, Mood,
  SYMPTOM_LABELS, MOOD_LABELS, MOOD_EMOJIS,
  DISCHARGE_LABELS, DISCHARGE_DESCRIPTIONS, FLOW_LABELS,
} from '../../../src/models/log';

const ALL_SYMPTOMS: Symptom[] = [
  'cramps', 'bloating', 'headache', 'backache', 'breast_tenderness',
  'acne', 'nausea', 'fatigue', 'insomnia', 'dizziness',
  'pelvic_pain', 'constipation', 'diarrhea',
];
const ALL_MOODS: Mood[] = [
  'happy', 'calm', 'energetic', 'anxious', 'irritable',
  'sad', 'emotional', 'focused', 'foggy', 'overwhelmed',
];
const DISCHARGE_OPTIONS: DischargeType[] = ['none', 'sticky', 'creamy', 'watery', 'egg_white', 'atypical'];
const FLOW_OPTIONS: FlowIntensity[] = ['none', 'spotting', 'light', 'medium', 'heavy'];

export default function LogEntryScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { date: dateParam } = useLocalSearchParams<{ date?: string }>();
  const { saveLog } = useLogStore();

  // Validate the param is a proper YYYY-MM-DD date; fall back to today if not
  const today = todayDate();
  const isValidDate = dateParam ? /^\d{4}-\d{2}-\d{2}$/.test(dateParam) && !isNaN(Date.parse(dateParam)) : false;
  const targetDate = (isValidDate && dateParam! <= today) ? dateParam! : today;
  const isToday = targetDate === today;

  const [ready, setReady] = useState(false);
  const [flow, setFlow] = useState<FlowIntensity>('none');
  const [discharge, setDischarge] = useState<DischargeType>('none');
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [moods, setMoods] = useState<Mood[]>([]);
  const [energy, setEnergy] = useState<1 | 2 | 3>(2);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getLogForDate(targetDate).then((existing) => {
      if (existing) {
        setFlow(existing.flowIntensity);
        setDischarge(existing.discharge);
        setSymptoms(existing.symptoms);
        setMoods(existing.moods);
        setEnergy(existing.energyLevel ?? 2);
      }
      setReady(true);
    });
  }, [targetDate]);

  function toggle<T>(list: T[], item: T, setList: (v: T[]) => void) {
    if (list.includes(item)) {
      setList(list.filter((i) => i !== item));
    } else {
      setList([...list, item]);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      await saveLog({
        date: targetDate,
        cycleRecordId: null,
        isPeriodDay: flow !== 'none',
        flowIntensity: flow,
        discharge,
        symptoms,
        moods,
        energyLevel: energy,
        notes: null,
      });
      router.back();
    } finally {
      setSaving(false);
    }
  }

  if (!ready) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  const headerTitle = isToday
    ? "Today's Log"
    : format(parseISO(targetDate), 'EEE, d MMM');

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Button mode="text" onPress={() => router.back()} icon="arrow-left">
          Back
        </Button>
        <Text variant="titleLarge" style={[styles.title, { color: theme.colors.onBackground }]}>
          {headerTitle}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Flow */}
        <SectionCard label="Flow">
          <View style={styles.flowRow}>
            {FLOW_OPTIONS.map((f) => (
              <Chip
                key={f}
                selected={flow === f}
                onPress={() => setFlow(f)}
                showSelectedCheck
              >
                {FLOW_LABELS[f]}
              </Chip>
            ))}
          </View>
        </SectionCard>

        {/* Energy */}
        <SectionCard label="Energy Level">
          <View style={styles.energyGrid}>
            {([1, 2, 3] as const).map((n, i) => {
              const label = ['Low', 'Moderate', 'High'][i];
              const active = energy === n;
              return (
                <Button
                  key={n}
                  mode={active ? 'contained' : 'outlined'}
                  onPress={() => setEnergy(n)}
                  style={styles.energyBtn}
                  labelStyle={styles.energyLabel}
                >
                  {label}
                </Button>
              );
            })}
          </View>
        </SectionCard>

        {/* Mood */}
        <SectionCard label="Mood">
          <View style={styles.chipWrap}>
            {ALL_MOODS.map((m) => (
              <Chip
                key={m}
                selected={moods.includes(m)}
                onPress={() => toggle(moods, m, setMoods)}
                style={styles.chip}
                showSelectedCheck
              >
                {MOOD_LABELS[m]}
              </Chip>
            ))}
          </View>
        </SectionCard>

        {/* Symptoms */}
        <SectionCard label="Symptoms">
          <View style={styles.chipWrap}>
            {ALL_SYMPTOMS.map((s) => (
              <Chip
                key={s}
                selected={symptoms.includes(s)}
                onPress={() => toggle(symptoms, s, setSymptoms)}
                style={styles.chip}
                showSelectedCheck
              >
                {SYMPTOM_LABELS[s]}
              </Chip>
            ))}
          </View>
        </SectionCard>

        {/* Discharge */}
        <SectionCard label="Discharge">
          <View style={styles.chipWrap}>
            {DISCHARGE_OPTIONS.map((d) => (
              <Chip
                key={d}
                selected={discharge === d}
                onPress={() => setDischarge(d)}
                style={styles.chip}
                showSelectedCheck
              >
                {DISCHARGE_LABELS[d]}
              </Chip>
            ))}
          </View>
          {discharge !== 'none' && (
            <Text variant="bodySmall" style={{ color: '#888', marginTop: 2 }}>
              {DISCHARGE_DESCRIPTIONS[discharge]}
            </Text>
          )}
        </SectionCard>

      </ScrollView>

      <View style={styles.footer}>
        <Button
          mode="contained"
          onPress={handleSave}
          loading={saving}
          disabled={saving}
          style={styles.saveBtn}
          contentStyle={styles.saveBtnContent}
        >
          Save Log
        </Button>
      </View>
    </SafeAreaView>
  );
}

function SectionCard({
  children,
  label,
}: {
  children: React.ReactNode;
  label?: string;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.sectionCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceVariant }]}>
      {label && (
        <Text variant="titleSmall" style={[styles.sectionLabel, { color: theme.colors.onSurfaceVariant }]}>
          {label.toUpperCase()}
        </Text>
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingTop: 8, gap: 8 },
  title: { fontWeight: '700', flex: 1 },
  scroll: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 100, gap: 12 },
  sectionCard: {
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
  },
  sectionLabel: { fontWeight: '700', letterSpacing: 0.8, marginBottom: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  flowRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  flowChip: {},
  energyGrid: { flexDirection: 'row', gap: 8 },
  energyBtn: { flex: 1 },
  energyLabel: { fontSize: 13 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {},
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, paddingBottom: 32 },
  saveBtn: { borderRadius: 28 },
  saveBtnContent: { paddingVertical: 8 },
});
