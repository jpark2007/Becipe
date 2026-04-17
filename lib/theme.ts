// lib/theme.ts
export const colors = {
  // surfaces
  bg:        '#F4F4F0',  // page background
  bone:      '#FCFCFA',  // phone shell / screen background
  card:      '#FFFFFF',  // cards
  border:    '#ECECE6',
  borderSoft:'#F5F5F0',

  // text
  ink:       '#0B0B0C',
  inkSoft:   '#3A3A40',
  muted:     '#8A8A93',

  // sage — palate match / brand primary
  sage:      '#4A6B3E',
  sageDeep:  '#36502C',
  sageSoft:  '#EDF1E6',

  // clay — ritual / community / warm CTAs
  clay:      '#C24A28',
  clayDeep:  '#962E13',
  claySoft:  '#FBE7DF',

  // ochre — ratings / tries / counts
  ochre:     '#C7902A',
  ochreSoft: '#F8EED5',

  // avatar palette
  avJ:       '#3E2F20', // brown
  avE:       '#8B3A1F', // clay
  avS:       '#4A6B3E', // sage
  avM:       '#8A6320', // ochre
  avD:       '#3A5468', // slate
} as const;

export const type = {
  family: 'Inter_500Medium',         // body default
  familyBold: 'Inter_700Bold',
  familyHeavy: 'Inter_900Black',
  // sizes (px)
  display:   38,
  h1:        30,
  h2:        24,
  h3:        18,
  body:      14,
  bodySm:    12,
  caption:   11,
  micro:     10,
} as const;

export const space = {
  0: 0, 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 7: 32, 8: 40, 9: 48, 10: 64,
} as const;

export const radius = {
  sm: 10, md: 14, lg: 18, xl: 22, xxl: 28, pill: 999, circle: 9999,
} as const;

export const shadow = {
  card:  { shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 14, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  plate: { shadowColor: '#000', shadowOpacity: 0.30, shadowRadius: 18, shadowOffset: { width: 0, height: 14 }, elevation: 8 },
  cta:   { shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 4 },
} as const;
