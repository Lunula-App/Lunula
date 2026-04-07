import { CyclePhase } from '../models/cycle';

export const TEAL_LIGHT = {
  primary: '#00897B',
  primaryContainer: '#B2DFDB',
  onPrimary: '#FFFFFF',
  onPrimaryContainer: '#00363B',
  secondary: '#4DB6AC',
  secondaryContainer: '#E0F2F1',
  onSecondary: '#FFFFFF',
  background: '#F8FAFA',
  surface: '#FFFFFF',
  surfaceVariant: '#F0F4F4',
  onBackground: '#1C1B1F',
  onSurface: '#1C1B1F',
  onSurfaceVariant: '#49454F',
  outline: '#79747E',
  error: '#B3261E',
  onError: '#FFFFFF',
  shadow: '#000000',
};

export const TEAL_DARK = {
  primary: '#80CBC4',
  primaryContainer: '#00695C',
  onPrimary: '#003731',
  onPrimaryContainer: '#A7F3ED',
  secondary: '#4DB6AC',
  secondaryContainer: '#00403C',
  onSecondary: '#003731',
  background: '#121212',
  surface: '#1E1E1E',
  surfaceVariant: '#2C2C2C',
  onBackground: '#E6E1E5',
  onSurface: '#E6E1E5',
  onSurfaceVariant: '#CAC4D0',
  outline: '#938F99',
  error: '#F2B8B5',
  onError: '#601410',
  shadow: '#000000',
};

export const PHASE_COLORS: Record<CyclePhase, string> = {
  menstrual: '#EF9A9A',
  follicular: '#80CBC4',
  ovulatory: '#FFCC80',
  luteal: '#CE93D8',
};

export const PHASE_DARK_COLORS: Record<CyclePhase, string> = {
  menstrual: '#C62828',
  follicular: '#00897B',
  ovulatory: '#E65100',
  luteal: '#7B1FA2',
};

export const PHASE_LABEL_COLORS: Record<CyclePhase, string> = {
  menstrual: '#B71C1C',
  follicular: '#004D40',
  ovulatory: '#E65100',
  luteal: '#4A148C',
};
