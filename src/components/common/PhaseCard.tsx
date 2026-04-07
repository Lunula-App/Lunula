import { View, StyleSheet } from 'react-native';
import { Text, useTheme, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CyclePrediction } from '../../models/cycle';
import { PHASE_COLORS } from '../../theme/colors';

interface Props {
  prediction: CyclePrediction;
}

const PHASE_EMOJIS = {
  menstrual: '🌑',
  follicular: '🌒',
  ovulatory: '🌕',
  luteal: '🌖',
};

export default function PhaseCard({ prediction }: Props) {
  const theme = useTheme();
  const phaseColor = PHASE_COLORS[prediction.currentPhase];

  if (prediction.isIrregular) {
    return <IrregularPhaseCard prediction={prediction} phaseColor={phaseColor} />;
  }

  return (
    <Surface
      style={[styles.card, { backgroundColor: phaseColor + '33', borderColor: phaseColor }]}
      elevation={0}
    >
      <View style={styles.row}>
        <Text style={styles.emoji}>
          {PHASE_EMOJIS[prediction.currentPhase]}
        </Text>
        <View style={styles.info}>
          <Text variant="labelSmall" style={{ color: phaseColor }}>
            {prediction.phaseLabel.toUpperCase()}
          </Text>
          <Text variant="titleLarge" style={{ color: theme.colors.onBackground, fontWeight: '700' }}>
            Day {prediction.currentCycleDay}
          </Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            Phase day {prediction.phaseDay} of {prediction.phaseTotalDays}
          </Text>
        </View>
        <View style={styles.countdown}>
          <Text variant="displaySmall" style={{ color: phaseColor, fontWeight: '700' }}>
            {prediction.daysUntilNextPeriod}
          </Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
            days until{'\n'}next period
          </Text>
        </View>
      </View>

      <View style={[styles.progressBar, { backgroundColor: theme.colors.surfaceVariant }]}>
        <View
          style={[
            styles.progressFill,
            {
              backgroundColor: phaseColor,
              width: `${Math.min(
                100,
                (prediction.phaseDay / prediction.phaseTotalDays) * 100
              )}%`,
            },
          ]}
        />
      </View>
    </Surface>
  );
}

function IrregularPhaseCard({
  prediction,
  phaseColor,
}: {
  prediction: CyclePrediction;
  phaseColor: string;
}) {
  const theme = useTheme();

  const rangeLabel =
    prediction.daysUntilEarliest !== null && prediction.daysUntilLatest !== null
      ? prediction.daysUntilEarliest === 0
        ? `Possible now – ${prediction.daysUntilLatest} days away`
        : `${prediction.daysUntilEarliest}–${prediction.daysUntilLatest} days away`
      : 'Tracking your pattern…';

  return (
    <Surface
      style={[styles.card, { backgroundColor: phaseColor + '22', borderColor: phaseColor + '88' }]}
      elevation={0}
    >
      <View style={styles.row}>
        <Text style={styles.emoji}>{PHASE_EMOJIS[prediction.currentPhase]}</Text>
        <View style={styles.info}>
          <Text variant="labelSmall" style={{ color: phaseColor }}>
            {prediction.phaseLabel.toUpperCase()} · IRREGULAR
          </Text>
          <Text variant="titleLarge" style={{ color: theme.colors.onBackground, fontWeight: '700' }}>
            Day {prediction.currentCycleDay}
          </Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            Estimated phase — varies cycle to cycle
          </Text>
        </View>
      </View>

      {/* Range band */}
      <View style={[styles.rangeBand, { backgroundColor: theme.colors.surfaceVariant }]}>
        <MaterialCommunityIcons name="calendar-range" size={16} color={theme.colors.onSurfaceVariant} />
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, flex: 1 }}>
          Next period: {rangeLabel}
        </Text>
      </View>

      <Text variant="bodySmall" style={[styles.irregularNote, { color: theme.colors.onSurfaceVariant }]}>
        Predictions widen because your cycles vary. Keep logging to refine this estimate.
      </Text>
    </Surface>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1.5,
    gap: 16,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  emoji: { fontSize: 44 },
  info: { flex: 1, gap: 2 },
  countdown: { alignItems: 'center', minWidth: 60 },
  progressBar: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  rangeBand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 10,
  },
  irregularNote: { lineHeight: 18, fontStyle: 'italic' },
});
