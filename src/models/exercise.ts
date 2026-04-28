import { CyclePhase } from './cycle';

export type ExercisePhase = CyclePhase | 'all';

export type ExerciseType =
  | 'kegel_basic'
  | 'kegel_hold'
  | 'kegel_pulse'
  | 'reverse_kegel'
  | 'diaphragmatic_breath'
  | 'hip_bridge'
  | 'deep_squat'
  | 'tutorial';

export interface ExerciseDefinition {
  id: string;
  slug: string;
  type: ExerciseType;
  name: string;
  description: string;
  phase: ExercisePhase;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  progressionLevel: 1 | 2 | 3;
  holdDurationMs: number;
  holdDurations?: number[];   // per-rep hold durations; overrides holdDurationMs when present
  relaxDurationMs: number;
  setRestDurationMs: number;  // rest between sets (longer than rep relax)
  reps: number;
  sets: number;
  breathingCue: string;
  relaxCue: string;
  benefits: string[];
  contraindications: string[];
}

export interface ExerciseSession {
  id: string;
  date: string;            // YYYY-MM-DD
  exerciseId: string;
  setsCompleted: number;
  repsCompleted: number;
  durationSeconds: number;
  notes: string | null;
  createdAt: string;
}
