import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { CyclePhase } from '../../models/cycle';
import { PHASE_COLORS } from '../../theme/colors';

interface Props {
  phase: 'hold' | 'relax' | 'rest' | 'idle';
  cyclePhase: CyclePhase;
  holdDurationMs: number;
  relaxDurationMs: number;
  cue: string;
  countdown: number; // seconds remaining in current phase
  rep: number;
  totalReps: number;
}

export default function PulsingCircle({
  phase,
  cyclePhase,
  holdDurationMs,
  relaxDurationMs,
  cue,
  countdown,
  rep,
  totalReps,
}: Props) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.6);
  const color = PHASE_COLORS[cyclePhase];

  useEffect(() => {
    if (phase === 'hold') {
      scale.value = withTiming(1.35, {
        duration: holdDurationMs,
        easing: Easing.inOut(Easing.ease),
      });
      opacity.value = withTiming(1, { duration: 300 });
    } else if (phase === 'relax') {
      scale.value = withTiming(1, {
        duration: relaxDurationMs,
        easing: Easing.inOut(Easing.ease),
      });
      opacity.value = withTiming(0.6, { duration: 300 });
    } else if (phase === 'rest') {
      // Settle to a gentle idle pulse during set rest
      scale.value = withTiming(0.9, { duration: 600, easing: Easing.out(Easing.ease) });
      opacity.value = withTiming(0.4, { duration: 600 });
    } else {
      scale.value = withTiming(1, { duration: 400 });
      opacity.value = withTiming(0.5, { duration: 400 });
    }
  }, [phase]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const isHolding = phase === 'hold';
  const isResting = phase === 'rest';

  return (
    <View style={styles.container}>
      {/* Circle + text overlay, sized to the base (unscaled) ring */}
      <View style={styles.circleWrapper}>
        {/* Animated ring — scales but never clips the text above */}
        <Animated.View style={[styles.outerRing, { borderColor: color }, animatedStyle]}>
          <View style={[styles.innerCircle, { backgroundColor: color }]} />
        </Animated.View>

        {/* Text sits on top, outside the animated view, so it never scales */}
        <View style={styles.textOverlay} pointerEvents="none">
          <Text style={styles.countdownText}>{countdown}</Text>
          <Text style={styles.phaseText}>{isHolding ? 'HOLD' : isResting ? 'REST' : phase === 'relax' ? 'RELAX' : ''}</Text>
        </View>
      </View>

      {/* Cue text */}
      <Text style={[styles.cueText, { color: color }]}>{cue}</Text>

      {/* Rep counter */}
      <Text style={styles.repText}>
        Rep {Math.min(rep, totalReps)} of {totalReps}
      </Text>

      {/* Progress dots */}
      <View style={styles.dotsRow}>
        {Array.from({ length: totalReps }, (_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor: i < rep - 1 ? color : i === rep - 1 && phase === 'hold' ? color + 'AA' : '#E0E0E0',
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: 24 },
  circleWrapper: {
    width: 300,
    height: 300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerRing: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
  },
  textOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  countdownText: {
    fontSize: 56,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 64,
  },
  phaseText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  cueText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  repText: {
    fontSize: 14,
    color: '#9E9E9E',
    fontWeight: '500',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
    maxWidth: 280,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
