// lib/theme.ts
// Central design token system — Dishr v2
// Generated from Stitch design, Material Design 3 color scheme

export const COLORS = {
  // Backgrounds & surfaces
  surface: '#fbf9f4',
  surfaceContainer: '#f0eee9',
  surfaceContainerLow: '#f5f3ee',
  surfaceContainerHigh: '#eae8e3',
  surfaceContainerHighest: '#e4e2dd',
  surfaceContainerLowest: '#ffffff',
  surfaceDim: '#dbdad5',
  surfaceBright: '#fbf9f4',
  background: '#fbf9f4',

  // Text
  onSurface: '#1b1c19',
  onSurfaceVariant: '#55433a',
  onBackground: '#1b1c19',

  // Primary — burnt orange / terra
  primary: '#994413',
  primaryContainer: '#b85c2a',
  primaryFixed: '#ffdbcc',
  primaryFixedDim: '#ffb693',
  onPrimary: '#ffffff',
  onPrimaryContainer: '#fffeff',
  onPrimaryFixed: '#351000',
  inversePrimary: '#ffb693',
  surfaceTint: '#9a4614',

  // Secondary
  secondary: '#635e51',
  secondaryContainer: '#e7dfcf',
  secondaryFixed: '#eae2d2',
  secondaryFixedDim: '#cdc6b6',
  onSecondary: '#ffffff',
  onSecondaryContainer: '#676255',
  onSecondaryFixed: '#1f1b12',
  onSecondaryFixedVariant: '#4b463b',

  // Tertiary
  tertiary: '#5e5d5c',
  onTertiary: '#ffffff',

  // Borders
  outline: '#887269',
  outlineVariant: '#dcc1b6',

  // Inverse
  inverseSurface: '#30312e',
  inverseOnSurface: '#f2f1ec',

  // Error
  error: '#ba1a1a',
  errorContainer: '#ffdad6',
  onError: '#ffffff',
  onErrorContainer: '#93000a',
} as const;

export const FONTS = {
  // Newsreader — editorial headline/display
  headline: 'Newsreader_400Regular',
  headlineBold: 'Newsreader_700Bold',
  headlineItalic: 'Newsreader_400Regular_Italic',
  headlineSemiBold: 'Newsreader_600SemiBold',

  // Inter — body text and UI labels
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemiBold: 'Inter_600SemiBold',
  bodyBold: 'Inter_700Bold',

  // DM Mono — metadata, ratings, timestamps, tags
  mono: 'DMMono_400Regular',
  monoMedium: 'DMMono_500Medium',
} as const;
