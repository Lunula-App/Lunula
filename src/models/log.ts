export type FlowIntensity = 'none' | 'spotting' | 'light' | 'medium' | 'heavy';

export type Symptom =
  | 'cramps'
  | 'bloating'
  | 'headache'
  | 'backache'
  | 'breast_tenderness'
  | 'acne'
  | 'nausea'
  | 'fatigue'
  | 'insomnia'
  | 'dizziness'
  | 'hot_flashes'
  | 'discharge'
  | 'pelvic_pain'
  | 'constipation'
  | 'diarrhea';

export type Mood =
  | 'happy'
  | 'calm'
  | 'energetic'
  | 'anxious'
  | 'irritable'
  | 'sad'
  | 'emotional'
  | 'focused'
  | 'foggy'
  | 'overwhelmed';

export type Craving =
  | 'sweet'
  | 'salty'
  | 'fatty'
  | 'spicy'
  | 'carbs'
  | 'caffeine'
  | 'none';

export interface DailyLog {
  id: string;
  date: string;               // YYYY-MM-DD, unique per user
  cycleRecordId: string | null;
  isPeriodDay: boolean;
  flowIntensity: FlowIntensity;
  symptoms: Symptom[];
  moods: Mood[];
  cravings: Craving[];
  energyLevel: 1 | 2 | 3 | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export const SYMPTOM_LABELS: Record<Symptom, string> = {
  cramps: 'Cramps',
  bloating: 'Bloating',
  headache: 'Headache',
  backache: 'Backache',
  breast_tenderness: 'Breast Tenderness',
  acne: 'Acne',
  nausea: 'Nausea',
  fatigue: 'Fatigue',
  insomnia: 'Insomnia',
  dizziness: 'Dizziness',
  hot_flashes: 'Hot Flashes',
  discharge: 'Discharge',
  pelvic_pain: 'Pelvic Pain',
  constipation: 'Constipation',
  diarrhea: 'Diarrhea',
};

export const MOOD_LABELS: Record<Mood, string> = {
  happy: 'Happy',
  calm: 'Calm',
  energetic: 'Energetic',
  anxious: 'Anxious',
  irritable: 'Irritable',
  sad: 'Sad',
  emotional: 'Emotional',
  focused: 'Focused',
  foggy: 'Brain Fog',
  overwhelmed: 'Overwhelmed',
};

export const MOOD_EMOJIS: Record<Mood, string> = {
  happy: '😊',
  calm: '😌',
  energetic: '⚡',
  anxious: '😰',
  irritable: '😤',
  sad: '😢',
  emotional: '🥺',
  focused: '🎯',
  foggy: '😶‍🌫️',
  overwhelmed: '😵',
};

export const CRAVING_LABELS: Record<Craving, string> = {
  sweet: 'Sweet',
  salty: 'Salty',
  fatty: 'Fatty',
  spicy: 'Spicy',
  carbs: 'Carbs',
  caffeine: 'Caffeine',
  none: 'No Cravings',
};

export const FLOW_LABELS: Record<FlowIntensity, string> = {
  none: 'None',
  spotting: 'Spotting',
  light: 'Light',
  medium: 'Medium',
  heavy: 'Heavy',
};
