export type AccentKey =
  | 'teal'
  | 'rose'
  | 'violet'
  | 'blue'
  | 'amber'
  | 'sage'
  | 'coral'
  | 'slate';

interface AccentPalette {
  label: string;
  swatch: string; // representative colour for the picker dot
  light: {
    primary: string;
    primaryContainer: string;
    onPrimary: string;
    onPrimaryContainer: string;
    secondary: string;
    secondaryContainer: string;
    onSecondary: string;
  };
  dark: {
    primary: string;
    primaryContainer: string;
    onPrimary: string;
    onPrimaryContainer: string;
    secondary: string;
    secondaryContainer: string;
    onSecondary: string;
  };
}

export const ACCENTS: Record<AccentKey, AccentPalette> = {
  teal: {
    label: 'Teal',
    swatch: '#00897B',
    light: {
      primary: '#00897B',
      primaryContainer: '#B2DFDB',
      onPrimary: '#FFFFFF',
      onPrimaryContainer: '#00363B',
      secondary: '#4DB6AC',
      secondaryContainer: '#E0F2F1',
      onSecondary: '#FFFFFF',
    },
    dark: {
      primary: '#80CBC4',
      primaryContainer: '#00695C',
      onPrimary: '#003731',
      onPrimaryContainer: '#A7F3ED',
      secondary: '#4DB6AC',
      secondaryContainer: '#00403C',
      onSecondary: '#003731',
    },
  },
  rose: {
    label: 'Rose',
    swatch: '#C2185B',
    light: {
      primary: '#C2185B',
      primaryContainer: '#FCE4EC',
      onPrimary: '#FFFFFF',
      onPrimaryContainer: '#880E4F',
      secondary: '#F06292',
      secondaryContainer: '#FFDDE7',
      onSecondary: '#FFFFFF',
    },
    dark: {
      primary: '#F48FB1',
      primaryContainer: '#880E4F',
      onPrimary: '#5D001F',
      onPrimaryContainer: '#FFDDE7',
      secondary: '#F48FB1',
      secondaryContainer: '#6D1130',
      onSecondary: '#3C0018',
    },
  },
  violet: {
    label: 'Violet',
    swatch: '#7B1FA2',
    light: {
      primary: '#7B1FA2',
      primaryContainer: '#E1BEE7',
      onPrimary: '#FFFFFF',
      onPrimaryContainer: '#4A0072',
      secondary: '#AB47BC',
      secondaryContainer: '#F3E5F5',
      onSecondary: '#FFFFFF',
    },
    dark: {
      primary: '#CE93D8',
      primaryContainer: '#6A1B9A',
      onPrimary: '#3C0060',
      onPrimaryContainer: '#F3E5F5',
      secondary: '#CE93D8',
      secondaryContainer: '#4A148C',
      onSecondary: '#260041',
    },
  },
  blue: {
    label: 'Blue',
    swatch: '#1565C0',
    light: {
      primary: '#1565C0',
      primaryContainer: '#BBDEFB',
      onPrimary: '#FFFFFF',
      onPrimaryContainer: '#0D47A1',
      secondary: '#42A5F5',
      secondaryContainer: '#E3F2FD',
      onSecondary: '#FFFFFF',
    },
    dark: {
      primary: '#90CAF9',
      primaryContainer: '#1565C0',
      onPrimary: '#003087',
      onPrimaryContainer: '#E3F2FD',
      secondary: '#90CAF9',
      secondaryContainer: '#0D47A1',
      onSecondary: '#003087',
    },
  },
  amber: {
    label: 'Amber',
    swatch: '#E65100',
    light: {
      primary: '#E65100',
      primaryContainer: '#FFF3E0',
      onPrimary: '#FFFFFF',
      onPrimaryContainer: '#BF360C',
      secondary: '#FF8F00',
      secondaryContainer: '#FFF8E1',
      onSecondary: '#FFFFFF',
    },
    dark: {
      primary: '#FFCC80',
      primaryContainer: '#E65100',
      onPrimary: '#452B00',
      onPrimaryContainer: '#FFE0B2',
      secondary: '#FFD54F',
      secondaryContainer: '#BF360C',
      onSecondary: '#3E2000',
    },
  },
  sage: {
    label: 'Sage',
    swatch: '#2E7D32',
    light: {
      primary: '#2E7D32',
      primaryContainer: '#C8E6C9',
      onPrimary: '#FFFFFF',
      onPrimaryContainer: '#1B5E20',
      secondary: '#66BB6A',
      secondaryContainer: '#E8F5E9',
      onSecondary: '#FFFFFF',
    },
    dark: {
      primary: '#A5D6A7',
      primaryContainer: '#2E7D32',
      onPrimary: '#003300',
      onPrimaryContainer: '#E8F5E9',
      secondary: '#A5D6A7',
      secondaryContainer: '#1B5E20',
      onSecondary: '#002200',
    },
  },
  coral: {
    label: 'Coral',
    swatch: '#D84315',
    light: {
      primary: '#D84315',
      primaryContainer: '#FBE9E7',
      onPrimary: '#FFFFFF',
      onPrimaryContainer: '#BF360C',
      secondary: '#FF7043',
      secondaryContainer: '#FFF3E0',
      onSecondary: '#FFFFFF',
    },
    dark: {
      primary: '#FFAB91',
      primaryContainer: '#BF360C',
      onPrimary: '#5D1100',
      onPrimaryContainer: '#FFCCBC',
      secondary: '#FFAB91',
      secondaryContainer: '#7F2800',
      onSecondary: '#3E0900',
    },
  },
  slate: {
    label: 'Slate',
    swatch: '#455A64',
    light: {
      primary: '#455A64',
      primaryContainer: '#ECEFF1',
      onPrimary: '#FFFFFF',
      onPrimaryContainer: '#263238',
      secondary: '#78909C',
      secondaryContainer: '#F5F5F5',
      onSecondary: '#FFFFFF',
    },
    dark: {
      primary: '#B0BEC5',
      primaryContainer: '#37474F',
      onPrimary: '#1C313A',
      onPrimaryContainer: '#ECEFF1',
      secondary: '#90A4AE',
      secondaryContainer: '#263238',
      onSecondary: '#0A1F26',
    },
  },
};

export const DEFAULT_ACCENT: AccentKey = 'teal';
