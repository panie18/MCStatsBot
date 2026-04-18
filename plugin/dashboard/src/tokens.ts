// ──────────────────────────────────────────────────────────────
// CSS Variable References — exakt wie Weather App
// ──────────────────────────────────────────────────────────────

export const v = {
  primary:                  'var(--m3-pri)',
  onPrimary:                'var(--m3-on-pri)',
  primaryContainer:         'var(--m3-pri-c)',
  onPrimaryContainer:       'var(--m3-on-pri-c)',
  secondary:                'var(--m3-sec)',
  onSecondary:              'var(--m3-on-sec)',
  secondaryContainer:       'var(--m3-sec-c)',
  onSecondaryContainer:     'var(--m3-on-sec-c)',
  tertiary:                 'var(--m3-ter)',
  onTertiary:               'var(--m3-on-ter)',
  tertiaryContainer:        'var(--m3-ter-c)',
  onTertiaryContainer:      'var(--m3-on-ter-c)',
  error:                    'var(--m3-err)',
  onError:                  'var(--m3-on-err)',
  errorContainer:           'var(--m3-err-c)',
  onErrorContainer:         'var(--m3-on-err-c)',
  surface:                  'var(--m3-srf)',
  onSurface:                'var(--m3-on-srf)',
  surfaceContainerLowest:   'var(--m3-srf-low)',
  surfaceContainer:         'var(--m3-srf-ctr)',
  surfaceContainerHigh:     'var(--m3-srf-hi)',
  surfaceContainerHighest:  'var(--m3-srf-hi2)',
  outline:                  'var(--m3-out)',
  outlineVariant:           'var(--m3-out-v)',
  elevatedSurface:          'var(--m3-elev)',
} as const;

export const tokens = v;

// ──────────────────────────────────────────────────────────────
// Shape Tokens (M3 Corner Radii)
// ──────────────────────────────────────────────────────────────

export const shape = {
  extraSmall: '4px',
  small:      '8px',
  medium:     '12px',
  large:      '16px',
  extraLarge: '28px',
  full:       '9999px',
} as const;

// ──────────────────────────────────────────────────────────────
// Tageszeit-System
// ──────────────────────────────────────────────────────────────

export type TimePeriod = 'night' | 'dawn' | 'morning' | 'afternoon' | 'evening';

export function getTimePeriod(hour: number): TimePeriod {
  if (hour >= 22 || hour < 5)  return 'night';
  if (hour < 8)                return 'dawn';
  if (hour < 13)               return 'morning';
  if (hour < 18)               return 'afternoon';
  return 'evening';
}

// ──────────────────────────────────────────────────────────────
// Palette-Typ
// ──────────────────────────────────────────────────────────────

export interface Palette {
  primary: string;              onPrimary: string;
  primaryContainer: string;     onPrimaryContainer: string;
  secondary: string;            onSecondary: string;
  secondaryContainer: string;   onSecondaryContainer: string;
  tertiary: string;             onTertiary: string;
  tertiaryContainer: string;    onTertiaryContainer: string;
  error: string;                onError: string;
  errorContainer: string;       onErrorContainer: string;
  surface: string;              onSurface: string;
  surfaceContainerLowest: string;
  surfaceContainer: string;
  surfaceContainerHigh: string;
  surfaceContainerHighest: string;
  outline: string;
  outlineVariant: string;
  elevatedSurface: string;
}

// ──────────────────────────────────────────────────────────────
// 5 Tageszeit-Paletten — exakt wie Weather App
// ──────────────────────────────────────────────────────────────

export const palettes: Record<TimePeriod, Palette> = {

  morning: {
    primary: '#4A8C5C',              onPrimary: '#FFFFFF',
    primaryContainer: '#C8F0D2',     onPrimaryContainer: '#1B3724',
    secondary: '#4D6356',            onSecondary: '#FFFFFF',
    secondaryContainer: '#D0E8D8',   onSecondaryContainer: '#1A2E22',
    tertiary: '#3D6373',             onTertiary: '#FFFFFF',
    tertiaryContainer: '#C1E8F8',    onTertiaryContainer: '#162831',
    error: '#BA1A1A',                onError: '#FFFFFF',
    errorContainer: '#FFDAD6',       onErrorContainer: '#410002',
    surface: '#F8FEFB',              onSurface: '#171D19',
    surfaceContainerLowest: '#FFFFFF',
    surfaceContainer: '#ECF3EE',
    surfaceContainerHigh: '#E0EAE3',
    surfaceContainerHighest: '#D5E1DA',
    outline: '#6F7973',
    outlineVariant: '#BFC9C1',
    elevatedSurface: '#F0F7F2',
  },

  afternoon: {
    primary: '#6B4E00',              onPrimary: '#FFFFFF',
    primaryContainer: '#FFDEA0',     onPrimaryContainer: '#3A2900',
    secondary: '#6B5D3F',            onSecondary: '#FFFFFF',
    secondaryContainer: '#F4E0BB',   onSecondaryContainer: '#241A04',
    tertiary: '#4A6546',             onTertiary: '#FFFFFF',
    tertiaryContainer: '#CCE8C5',    onTertiaryContainer: '#082008',
    error: '#BA1A1A',                onError: '#FFFFFF',
    errorContainer: '#FFDAD6',       onErrorContainer: '#410002',
    surface: '#FFFCF0',              onSurface: '#1D1B12',
    surfaceContainerLowest: '#FFFFFF',
    surfaceContainer: '#F2EFDF',
    surfaceContainerHigh: '#E8E5D6',
    surfaceContainerHighest: '#DDDACC',
    outline: '#6D6A5A',
    outlineVariant: '#C8C5B3',
    elevatedSurface: '#F5F2E5',
  },

  evening: {
    primary: '#5C2E90',              onPrimary: '#FFFFFF',
    primaryContainer: '#E8D5FF',     onPrimaryContainer: '#2D0F54',
    secondary: '#635B6E',            onSecondary: '#FFFFFF',
    secondaryContainer: '#E9DEF5',   onSecondaryContainer: '#1F1830',
    tertiary: '#7E525E',             onTertiary: '#FFFFFF',
    tertiaryContainer: '#FFD9E2',    onTertiaryContainer: '#31101C',
    error: '#BA1A1A',                onError: '#FFFFFF',
    errorContainer: '#FFDAD6',       onErrorContainer: '#410002',
    surface: '#F9F5FF',              onSurface: '#1C1B1F',
    surfaceContainerLowest: '#FFFFFF',
    surfaceContainer: '#F0ECF6',
    surfaceContainerHigh: '#E5E1EB',
    surfaceContainerHighest: '#DAD6E0',
    outline: '#787680',
    outlineVariant: '#C9C5D0',
    elevatedSurface: '#F3EFF9',
  },

  night: {
    primary: '#A8D4FF',              onPrimary: '#003355',
    primaryContainer: '#1A3A55',     onPrimaryContainer: '#C8E6FF',
    secondary: '#B0C8DC',            onSecondary: '#1A3040',
    secondaryContainer: '#2A4050',   onSecondaryContainer: '#D0E4F4',
    tertiary: '#C5C0E8',             onTertiary: '#2D2960',
    tertiaryContainer: '#3A3670',    onTertiaryContainer: '#E5E0FF',
    error: '#FFB4AB',                onError: '#690005',
    errorContainer: '#93000A',       onErrorContainer: '#FFDAD6',
    surface: '#0A1520',              onSurface: '#DEE3EA',
    surfaceContainerLowest: '#050E18',
    surfaceContainer: '#111D28',
    surfaceContainerHigh: '#1A2833',
    surfaceContainerHighest: '#24333F',
    outline: '#8A9198',
    outlineVariant: '#40484F',
    elevatedSurface: '#131F2A',
  },

  dawn: {
    primary: '#9E3418',              onPrimary: '#FFFFFF',
    primaryContainer: '#FFDAD2',     onPrimaryContainer: '#410200',
    secondary: '#775750',            onSecondary: '#FFFFFF',
    secondaryContainer: '#FFDAD2',   onSecondaryContainer: '#2C1510',
    tertiary: '#715B2E',             onTertiary: '#FFFFFF',
    tertiaryContainer: '#FDDFA6',    onTertiaryContainer: '#261900',
    error: '#BA1A1A',                onError: '#FFFFFF',
    errorContainer: '#FFDAD6',       onErrorContainer: '#410002',
    surface: '#FFF6F3',              onSurface: '#221A18',
    surfaceContainerLowest: '#FFFFFF',
    surfaceContainer: '#FCEAE5',
    surfaceContainerHigh: '#F0DFD9',
    surfaceContainerHighest: '#E5D4CF',
    outline: '#857370',
    outlineVariant: '#D8C2BC',
    elevatedSurface: '#FDF0EB',
  },
};

// ──────────────────────────────────────────────────────────────
// Palette → CSS Custom Properties
// ──────────────────────────────────────────────────────────────

export function paletteToCSS(p: Palette): string {
  return [
    `--m3-pri: ${p.primary}`,
    `--m3-on-pri: ${p.onPrimary}`,
    `--m3-pri-c: ${p.primaryContainer}`,
    `--m3-on-pri-c: ${p.onPrimaryContainer}`,
    `--m3-sec: ${p.secondary}`,
    `--m3-on-sec: ${p.onSecondary}`,
    `--m3-sec-c: ${p.secondaryContainer}`,
    `--m3-on-sec-c: ${p.onSecondaryContainer}`,
    `--m3-ter: ${p.tertiary}`,
    `--m3-on-ter: ${p.onTertiary}`,
    `--m3-ter-c: ${p.tertiaryContainer}`,
    `--m3-on-ter-c: ${p.onTertiaryContainer}`,
    `--m3-err: ${p.error}`,
    `--m3-on-err: ${p.onError}`,
    `--m3-err-c: ${p.errorContainer}`,
    `--m3-on-err-c: ${p.onErrorContainer}`,
    `--m3-srf: ${p.surface}`,
    `--m3-on-srf: ${p.onSurface}`,
    `--m3-srf-low: ${p.surfaceContainerLowest}`,
    `--m3-srf-ctr: ${p.surfaceContainer}`,
    `--m3-srf-hi: ${p.surfaceContainerHigh}`,
    `--m3-srf-hi2: ${p.surfaceContainerHighest}`,
    `--m3-out: ${p.outline}`,
    `--m3-out-v: ${p.outlineVariant}`,
    `--m3-elev: ${p.elevatedSurface}`,
  ].join('; ');
}
