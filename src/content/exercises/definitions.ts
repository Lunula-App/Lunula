import { ExerciseDefinition } from '../../models/exercise';

export const EXERCISES: ExerciseDefinition[] = [
  // ── TUTORIAL (shown to all, all phases) ───────────────────────────
  {
    id: 'tut-01',
    slug: 'what-is-a-kegel',
    type: 'tutorial',
    phase: 'all',
    name: 'What Is a Kegel?',
    description:
      'New to pelvic floor exercises? Start here. A kegel is a gentle squeeze of the muscles you would use to stop the flow of urine mid-stream. You should feel a lift and inward squeeze — not a tightening of your stomach, thighs, or buttocks.',
    difficulty: 'beginner',
    holdDurationMs: 3000,
    relaxDurationMs: 6000,
    setRestDurationMs: 30000,
    reps: 5,
    sets: 1,
    breathingCue: 'Gently lift and squeeze — breathe normally',
    relaxCue: 'Let go fully — rest twice as long as you held',
    benefits: [
      'Introduces the pelvic floor mind–muscle connection',
      'Builds confidence before progressing to full exercises',
      'Safe for complete beginners',
    ],
    contraindications: [
      'Do not perform these exercises while urinating — this can disrupt normal bladder function',
      'Stop if you feel any pain or discomfort',
      'Do not hold your breath',
      'Do not squeeze your glutes or stomach — isolate the pelvic floor only',
    ],
  },

  // ── MENSTRUAL PHASE ────────────────────────────────────────────────
  {
    id: 'men-01',
    slug: 'diaphragmatic-breathing',
    type: 'diaphragmatic_breath',
    phase: 'menstrual',
    name: 'Deep Belly Breathing',
    description:
      'Coordinates the diaphragm and pelvic floor to relieve cramping and activate the parasympathetic nervous system.',
    difficulty: 'beginner',
    holdDurationMs: 4000,
    relaxDurationMs: 6000,
    setRestDurationMs: 30000,
    reps: 8,
    sets: 2,
    breathingCue: 'Breathe in — feel belly expand',
    relaxCue: 'Slow exhale — let everything release',
    benefits: [
      'Reduces cramp intensity',
      'Activates parasympathetic (rest & digest) nervous system',
      'Reduces pelvic tension',
    ],
    contraindications: [],
  },
  {
    id: 'men-02',
    slug: 'gentle-reverse-kegel',
    type: 'reverse_kegel',
    phase: 'menstrual',
    name: 'Gentle Reverse Kegel',
    description:
      'Intentional lengthening of the pelvic floor to ease tension and reduce pain during menstruation.',
    difficulty: 'beginner',
    holdDurationMs: 5000,
    relaxDurationMs: 5000,
    setRestDurationMs: 30000,
    reps: 5,
    sets: 2,
    breathingCue: 'Gently bear down and open',
    relaxCue: 'Return to neutral — no squeeze',
    benefits: [
      'Relieves pelvic tension',
      'Reduces pain perception',
      'Promotes pelvic floor lengthening',
    ],
    contraindications: ['Reduce sets if bleeding is very heavy'],
  },

  // ── FOLLICULAR PHASE ───────────────────────────────────────────────
  {
    id: 'fol-01',
    slug: 'kegel-building-set',
    type: 'kegel_basic',
    phase: 'follicular',
    name: 'Standard Kegel — Building Set',
    description:
      'Classic pelvic floor contraction. Rising estrogen supports tissue recovery — ideal for building baseline strength.',
    difficulty: 'beginner',
    holdDurationMs: 5000,
    relaxDurationMs: 5000,
    setRestDurationMs: 30000,
    reps: 10,
    sets: 3,
    breathingCue: 'Lift and squeeze — exhale gently',
    relaxCue: 'Full release — feel the difference',
    benefits: [
      'Builds baseline pelvic floor strength',
      'Improves bladder control',
      'Establishes mind–muscle connection',
    ],
    contraindications: [
      'Do not perform while urinating — this can disrupt normal bladder function',
    ],
  },
  {
    id: 'fol-02',
    slug: 'long-hold-kegel',
    type: 'kegel_hold',
    phase: 'follicular',
    name: 'Long Hold Kegel',
    description:
      'Extended hold to build slow-twitch endurance fibers. Equal rest time ensures full recovery between reps.',
    difficulty: 'intermediate',
    holdDurationMs: 10000,
    relaxDurationMs: 10000,
    setRestDurationMs: 45000,
    reps: 5,
    sets: 3,
    breathingCue: 'Hold and breathe normally',
    relaxCue: 'Complete release for equal time',
    benefits: [
      'Endurance training for slow-twitch fibers',
      'Stress urinary incontinence prevention',
    ],
    contraindications: ['Stop if you feel a bearing-down sensation'],
  },

  {
    id: 'fol-01b',
    slug: 'short-hold-kegel',
    type: 'kegel_basic',
    phase: 'follicular',
    name: 'Short Hold Kegel',
    description:
      'A gentler introduction to kegel training — shorter holds with generous rest to let you focus on finding and releasing the right muscles.',
    difficulty: 'beginner',
    holdDurationMs: 3000,
    relaxDurationMs: 6000,
    setRestDurationMs: 30000,
    reps: 6,
    sets: 2,
    breathingCue: 'Lift and squeeze gently — exhale',
    relaxCue: 'Full release — feel the floor drop',
    benefits: [
      'Builds pelvic floor awareness',
      'Low fatigue — good starting point',
      'Establishes the squeeze-and-release pattern',
    ],
    contraindications: [
      'Do not perform while urinating — this can disrupt normal bladder function',
    ],
  },

  // ── OVULATORY PHASE ────────────────────────────────────────────────
  {
    id: 'ovu-01',
    slug: 'quick-flick-pulses',
    type: 'kegel_pulse',
    phase: 'ovulatory',
    name: 'Quick-Flick Pulses',
    description:
      'Fast-twitch training for coordination and reflexive continence. Peak tissue elasticity at ovulation makes this the ideal time.',
    difficulty: 'intermediate',
    holdDurationMs: 1000,
    relaxDurationMs: 1000,
    setRestDurationMs: 30000,
    reps: 20,
    sets: 3,
    breathingCue: 'Quick squeeze — snap!',
    relaxCue: 'Release — ready for next',
    benefits: [
      'Fast-twitch fiber activation',
      'Reflex continence improvement',
      'Pelvic floor coordination',
    ],
    contraindications: [],
  },
  {
    id: 'ovu-02',
    slug: 'kegel-bridge',
    type: 'hip_bridge',
    phase: 'ovulatory',
    name: 'Kegel Bridge',
    description:
      'Combines glute activation with pelvic floor contraction for functional, whole-body strength.',
    difficulty: 'intermediate',
    holdDurationMs: 6000,
    relaxDurationMs: 4000,
    setRestDurationMs: 30000,
    reps: 10,
    sets: 3,
    breathingCue: 'Bridge up — squeeze pelvic floor at top',
    relaxCue: 'Lower slowly — release floor',
    benefits: [
      'Functional pelvic floor strength',
      'Glute–pelvic coordination',
      'Core stability',
    ],
    contraindications: ['Avoid with sacroiliac joint pain'],
  },

  {
    id: 'ovu-01b',
    slug: 'slow-pulse-kegel',
    type: 'kegel_pulse',
    phase: 'ovulatory',
    name: 'Slow-Pulse Kegel',
    description:
      'A beginner-friendly version of the quick-flick — slower rhythm so you can focus on a clean squeeze and full release each time.',
    difficulty: 'beginner',
    holdDurationMs: 2000,
    relaxDurationMs: 3000,
    setRestDurationMs: 30000,
    reps: 8,
    sets: 2,
    breathingCue: 'Squeeze — hold briefly',
    relaxCue: 'Release fully before the next rep',
    benefits: [
      'Introduces fast-twitch coordination at a manageable pace',
      'Builds the squeeze-release rhythm',
    ],
    contraindications: [
      'Do not perform while urinating — this can disrupt normal bladder function',
    ],
  },
  {
    id: 'ovu-02b',
    slug: 'seated-pelvic-squeeze',
    type: 'kegel_basic',
    phase: 'ovulatory',
    name: 'Seated Pelvic Squeeze',
    description:
      'A supported alternative to the Kegel Bridge. Sitting upright with feet flat, squeeze the pelvic floor and hold — no balance or hip mobility required.',
    difficulty: 'beginner',
    holdDurationMs: 4000,
    relaxDurationMs: 5000,
    setRestDurationMs: 30000,
    reps: 8,
    sets: 2,
    breathingCue: 'Sit tall — squeeze and lift',
    relaxCue: 'Soften fully — feel the release',
    benefits: [
      'Accessible for all fitness levels',
      'Functional strength for everyday movement',
      'No equipment or floor work needed',
    ],
    contraindications: [
      'Do not perform while urinating — this can disrupt normal bladder function',
    ],
  },

  // ── LUTEAL PHASE ───────────────────────────────────────────────────
  {
    id: 'lut-01',
    slug: 'supported-deep-squat',
    type: 'deep_squat',
    phase: 'luteal',
    name: 'Supported Deep Squat',
    description:
      'Progesterone loosens ligaments in the luteal phase — a supported squat safely opens the pelvic floor for mobility work.',
    difficulty: 'beginner',
    holdDurationMs: 8000,
    relaxDurationMs: 4000,
    setRestDurationMs: 30000,
    reps: 5,
    sets: 2,
    breathingCue: 'Sink down — breathe and open',
    relaxCue: 'Rise slowly — gentle re-engage',
    benefits: [
      'Pelvic mobility',
      'Prepares for menstrual phase release',
      'Hip and groin opening',
    ],
    contraindications: ['Use wall or chair for support'],
  },
  {
    id: 'lut-02',
    slug: 'lengthening-relaxation',
    type: 'reverse_kegel',
    phase: 'luteal',
    name: 'Lengthening & Relaxation Sequence',
    description:
      'Balances the luteal tendency to hold tension with intentional pelvic floor release. Relax phase is longer than the hold.',
    difficulty: 'beginner',
    holdDurationMs: 6000,
    relaxDurationMs: 8000,
    setRestDurationMs: 30000,
    reps: 8,
    sets: 2,
    breathingCue: 'Gentle contraction — notice sensation',
    relaxCue: 'Let go completely — longer than the hold',
    benefits: [
      'Reduces PMS-related pelvic tension',
      'Maintains pelvic mobility before menstruation',
    ],
    contraindications: [],
  },
];

export function getExercisesForPhase(phase: string): ExerciseDefinition[] {
  return EXERCISES.filter((e) => e.phase === phase || e.phase === 'all');
}

export function getExerciseById(id: string): ExerciseDefinition | undefined {
  return EXERCISES.find((e) => e.id === id);
}
