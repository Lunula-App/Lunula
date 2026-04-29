export type FlowIntensity = 'none' | 'spotting' | 'light' | 'medium' | 'heavy';

export type DischargeType = 'none' | 'sticky' | 'creamy' | 'watery' | 'egg_white' | 'atypical';

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

export interface DailyLog {
  id: string;
  date: string;               // YYYY-MM-DD, unique per user
  cycleRecordId: string | null;
  isPeriodDay: boolean;
  flowIntensity: FlowIntensity;
  discharge: DischargeType;
  symptoms: Symptom[];
  moods: Mood[];
  energyLevel: 1 | 2 | 3 | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export const DISCHARGE_LABELS: Record<DischargeType, string> = {
  none: 'None',
  sticky: 'Sticky',
  creamy: 'Creamy',
  watery: 'Watery',
  egg_white: 'Egg White',
  atypical: 'Unusual',
};

export const DISCHARGE_DESCRIPTIONS: Record<DischargeType, string> = {
  none: 'Dry, no discharge',
  sticky: 'Thick, tacky — white or yellowish',
  creamy: 'Smooth, lotion-like — white or cream',
  watery: 'Wet, slippery — clear',
  egg_white: 'Clear, stretchy — peak fertile sign',
  atypical: 'Unusual colour, odour, or texture',
};

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

export const FLOW_LABELS: Record<FlowIntensity, string> = {
  none: 'None',
  spotting: 'Spotting',
  light: 'Light',
  medium: 'Medium',
  heavy: 'Heavy',
};
