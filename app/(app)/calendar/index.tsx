import { useEffect, useMemo } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, useTheme, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, DateData } from 'react-native-calendars';
import { format, parseISO } from 'date-fns';
import { useRouter } from 'expo-router';
import { useSettingsStore } from '../../../src/stores/settingsStore';
import { useLogStore } from '../../../src/stores/logStore';
import { computePrediction, getPhaseForDate } from '../../../src/services/cycleEngine';
import { PHASE_COLORS } from '../../../src/theme/colors';
import { CyclePhase } from '../../../src/models/cycle';
import { MOOD_LABELS, SYMPTOM_LABELS, Mood, Symptom } from '../../../src/models/log';

type MarkedDates = Record<string, {
  selected?: boolean;
  selectedColor?: string;
  dotColor?: string;
  dots?: { color: string }[];
  marked?: boolean;
}>;

export default function CalendarScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { settings } = useSettingsStore();
  const { recentLogs, loadRecent } = useLogStore();

  function handleDayPress(day: DateData) {
    const today = format(new Date(), 'yyyy-MM-dd');
    if (day.dateString > today) return; // no future logging
    router.push({
      pathname: '/(app)/today/log-entry',
      params: day.dateString === today ? {} : { date: day.dateString },
    });
  }

  useEffect(() => {
    loadRecent();
  }, []);

  const markedDates = useMemo<MarkedDates>(() => {
    if (!settings) return {};

    const marks: MarkedDates = {};
    const today = new Date();

    // Mark 3 months back to 3 months forward
    for (let i = -90; i <= 90; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      const dateStr = format(d, 'yyyy-MM-dd');
      const phase = getPhaseForDate(dateStr, settings);
      const color = PHASE_COLORS[phase];

      marks[dateStr] = {
        dotColor: color,
        marked: true,
        selectedColor: color + '55',
      };
    }

    // Overlay actual logged period days
    recentLogs
      .filter((l) => l.isPeriodDay)
      .forEach((l) => {
        marks[l.date] = {
          ...marks[l.date],
          selected: true,
          selectedColor: PHASE_COLORS.menstrual,
        };
      });

    // Today
    const todayStr = format(today, 'yyyy-MM-dd');
    marks[todayStr] = {
      ...marks[todayStr],
      selected: true,
      selectedColor: theme.colors.primary,
    };

    return marks;
  }, [settings, recentLogs, theme]);

  const prediction = useMemo(() => {
    if (!settings) return null;
    return computePrediction(settings);
  }, [settings]);

  // Phase trends: count mood/symptom occurrences per phase across all recent logs
  const phaseTrends = useMemo(() => {
    if (!settings || recentLogs.length === 0) return null;

    const phases: CyclePhase[] = ['menstrual', 'follicular', 'ovulatory', 'luteal'];
    const counts: Record<CyclePhase, { moods: Map<Mood, number>; symptoms: Map<Symptom, number>; days: number }> = {
      menstrual:  { moods: new Map(), symptoms: new Map(), days: 0 },
      follicular: { moods: new Map(), symptoms: new Map(), days: 0 },
      ovulatory:  { moods: new Map(), symptoms: new Map(), days: 0 },
      luteal:     { moods: new Map(), symptoms: new Map(), days: 0 },
    };

    for (const log of recentLogs) {
      const phase = getPhaseForDate(log.date, settings);
      counts[phase].days += 1;
      for (const m of log.moods) {
        counts[phase].moods.set(m, (counts[phase].moods.get(m) ?? 0) + 1);
      }
      for (const s of log.symptoms) {
        counts[phase].symptoms.set(s, (counts[phase].symptoms.get(s) ?? 0) + 1);
      }
    }

    // Only return phases that have at least 2 logged days
    return phases
      .filter((p) => counts[p].days >= 2)
      .map((p) => ({
        phase: p,
        topMoods: [...counts[p].moods.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([mood]) => MOOD_LABELS[mood]),
        topSymptoms: [...counts[p].symptoms.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([sym]) => SYMPTOM_LABELS[sym]),
      }))
      .filter((p) => p.topMoods.length > 0 || p.topSymptoms.length > 0);
  }, [settings, recentLogs]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.onBackground }]}>
            Calendar
          </Text>
        </View>

        <Calendar
          key={theme.dark ? 'dark' : 'light'}
          markingType="dot"
          markedDates={markedDates}
          onDayPress={handleDayPress}
          theme={{
            calendarBackground: theme.colors.surface,
            backgroundColor: theme.colors.surface,
            textSectionTitleColor: theme.colors.onSurfaceVariant,
            textSectionTitleDisabledColor: theme.colors.onSurfaceVariant + '55',
            selectedDayBackgroundColor: theme.colors.primary,
            selectedDayTextColor: theme.colors.onPrimary,
            todayTextColor: theme.colors.primary,
            todayBackgroundColor: theme.colors.primary + '22',
            dayTextColor: theme.colors.onSurface,
            textDisabledColor: theme.colors.onSurfaceVariant + '55',
            dotColor: theme.colors.primary,
            selectedDotColor: theme.colors.onPrimary,
            arrowColor: theme.colors.primary,
            disabledArrowColor: theme.colors.onSurfaceVariant + '55',
            monthTextColor: theme.colors.onSurface,
            indicatorColor: theme.colors.primary,
            textDayFontWeight: '400',
            textMonthFontWeight: '600',
            textDayHeaderFontWeight: '500',
            textDayFontSize: 14,
            textMonthFontSize: 16,
            textDayHeaderFontSize: 12,
          }}
          style={[styles.calendar, { backgroundColor: theme.colors.surface }]}
        />

        {/* Phase legend */}
        <View style={[styles.legend, { backgroundColor: theme.colors.surface }]}>
          <Text variant="titleSmall" style={[styles.legendTitle, { color: theme.colors.onSurfaceVariant }]}>
            PHASE LEGEND
          </Text>
          <View style={styles.legendRow}>
            {(Object.keys(PHASE_COLORS) as CyclePhase[]).map((phase) => (
              <View key={phase} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: PHASE_COLORS[phase] }]} />
                <Text variant="bodySmall" style={{ color: theme.colors.onSurface }}>
                  {phase.charAt(0).toUpperCase() + phase.slice(1)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Upcoming key dates */}
        {prediction && (
          <View style={styles.upcoming}>
            <Text variant="titleSmall" style={[styles.legendTitle, { color: theme.colors.onSurfaceVariant }]}>
              KEY DATES
            </Text>
            {!prediction.isIrregular && (
              <KeyDateRow
                icon="seed-outline"
                label="Ovulation window"
                value={`${formatDate(prediction.ovulationWindowStart)} – ${formatDate(prediction.ovulationWindowEnd)}`}
                color={PHASE_COLORS.ovulatory}
              />
            )}
            <KeyDateRow
              icon="calendar-month-outline"
              label={prediction.isIrregular ? 'Next period (estimated range)' : 'Predicted next period'}
              value={
                prediction.isIrregular && prediction.nextPeriodEarliestDate && prediction.nextPeriodLatestDate
                  ? `${formatDate(prediction.nextPeriodEarliestDate)} – ${formatDate(prediction.nextPeriodLatestDate)}`
                  : formatDate(prediction.nextPeriodDate)
              }
              color={PHASE_COLORS.menstrual}
            />
            {prediction.isIrregular && (
              <View style={styles.irregularNotice}>
                <MaterialCommunityIcons name="information-outline" size={14} color="#78909C" />
                <Text variant="bodySmall" style={{ color: '#78909C', flex: 1, lineHeight: 18 }}>
                  Your cycles vary — predictions show the likely window rather than a single date.
                  Phase estimates may not reflect your exact experience.
                </Text>
              </View>
            )}
          </View>
        )}
        {/* Phase trends */}
        {phaseTrends && phaseTrends.length > 0 && (
          <View style={styles.trendsSection}>
            <Text variant="titleSmall" style={[styles.legendTitle, { color: theme.colors.onSurfaceVariant }]}>
              YOUR PATTERNS (LAST 90 DAYS)
            </Text>
            {phaseTrends.map(({ phase, topMoods, topSymptoms }) => (
              <View
                key={phase}
                style={[styles.trendCard, {
                  backgroundColor: theme.colors.surface,
                  borderLeftColor: PHASE_COLORS[phase as CyclePhase],
                }]}
              >
                <Text
                  variant="titleSmall"
                  style={{ color: PHASE_COLORS[phase as CyclePhase], fontWeight: '700', marginBottom: 8 }}
                >
                  {phase.charAt(0).toUpperCase() + phase.slice(1)}
                </Text>
                {topMoods.length > 0 && (
                  <View style={styles.trendRow}>
                    <Text variant="bodySmall" style={[styles.trendLabel, { color: theme.colors.onSurfaceVariant }]}>
                      Mood
                    </Text>
                    <View style={styles.trendPills}>
                      {topMoods.map((m) => (
                        <View key={m} style={[styles.pill, { backgroundColor: PHASE_COLORS[phase as CyclePhase] + '22' }]}>
                          <Text variant="bodySmall" style={{ color: theme.colors.onSurface }}>{m}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
                {topSymptoms.length > 0 && (
                  <View style={styles.trendRow}>
                    <Text variant="bodySmall" style={[styles.trendLabel, { color: theme.colors.onSurfaceVariant }]}>
                      Symptoms
                    </Text>
                    <View style={styles.trendPills}>
                      {topSymptoms.map((s) => (
                        <View key={s} style={[styles.pill, { backgroundColor: theme.colors.surfaceVariant }]}>
                          <Text variant="bodySmall" style={{ color: theme.colors.onSurface }}>{s}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function KeyDateRow({
  icon, label, value, color,
}: {
  icon: string; label: string; value: string; color: string;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.keyDateRow, { borderColor: color + '44', backgroundColor: color + '11' }]}>
      <MaterialCommunityIcons name={icon as any} size={22} color={color} />
      <View style={{ flex: 1 }}>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
          {label}
        </Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, fontWeight: '600' }}>
          {value}
        </Text>
      </View>
    </View>
  );
}

function formatDate(dateStr: string): string {
  return format(parseISO(dateStr), 'd MMMM yyyy');
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  title: { fontWeight: '700' },
  calendar: { borderRadius: 16, marginHorizontal: 16, overflow: 'hidden' },
  legend: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  legendTitle: { fontWeight: '700', letterSpacing: 0.8 },
  legendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot: { width: 12, height: 12, borderRadius: 6 },
  upcoming: { marginHorizontal: 16, marginTop: 16, gap: 10 },
  trendsSection: { marginHorizontal: 16, marginTop: 16, marginBottom: 24, gap: 10 },
  trendCard: {
    borderRadius: 12,
    borderLeftWidth: 4,
    padding: 14,
    gap: 6,
  },
  trendRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  trendLabel: { width: 62, paddingTop: 3, fontWeight: '600' },
  trendPills: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  keyDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  irregularNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingHorizontal: 4,
    paddingTop: 2,
  },
});
