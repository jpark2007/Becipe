import ingredientData from './ingredient-data.json';

export type UnitSystem = 'us' | 'metric';

type UnitType = 'volume' | 'weight' | 'unknown';

interface IngredientEntry {
  g_per_cup: number;
}

const VOLUME_TO_ML: Record<string, number> = {
  tsp: 236.6 / 48,
  tbsp: 236.6 / 16,
  'fl oz': 29.57,
  cup: 236.6,
  pint: 236.6 * 2,
  quart: 946.4,
  gallon: 946.4 * 4,
  ml: 1,
  L: 1000,
};

const WEIGHT_TO_G: Record<string, number> = {
  oz: 453.6 / 16,
  lb: 453.6,
  g: 1,
  kg: 1000,
};

const UNIT_ALIASES: Record<string, string> = {
  teaspoon: 'tsp',
  teaspoons: 'tsp',
  tsp: 'tsp',
  tablespoon: 'tbsp',
  tablespoons: 'tbsp',
  tbsp: 'tbsp',
  T: 'tbsp',
  Tbsp: 'tbsp',
  'fluid ounce': 'fl oz',
  'fluid ounces': 'fl oz',
  'fl oz': 'fl oz',
  cup: 'cup',
  cups: 'cup',
  c: 'cup',
  pint: 'pint',
  pints: 'pint',
  pt: 'pint',
  quart: 'quart',
  quarts: 'quart',
  qt: 'quart',
  gallon: 'gallon',
  gallons: 'gallon',
  gal: 'gallon',
  milliliter: 'ml',
  milliliters: 'ml',
  millilitre: 'ml',
  millilitres: 'ml',
  mL: 'ml',
  ml: 'ml',
  liter: 'L',
  liters: 'L',
  litre: 'L',
  litres: 'L',
  l: 'L',
  L: 'L',
  ounce: 'oz',
  ounces: 'oz',
  oz: 'oz',
  pound: 'lb',
  pounds: 'lb',
  lb: 'lb',
  lbs: 'lb',
  gram: 'g',
  grams: 'g',
  g: 'g',
  kilogram: 'kg',
  kilograms: 'kg',
  kg: 'kg',
};

function normalizeUnit(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  return UNIT_ALIASES[trimmed] ?? null;
}

function classifyUnit(unit: string): UnitType {
  if (unit in VOLUME_TO_ML) return 'volume';
  if (unit in WEIGHT_TO_G) return 'weight';
  return 'unknown';
}

function getDensity(ingredientName: string): number | null {
  const densities = (ingredientData as any).densities as Record<string, IngredientEntry>;
  if (!densities) return null;
  const key = ingredientName.toLowerCase().trim();
  const entry = densities[key];
  return entry?.g_per_cup ?? null;
}

export function convert(
  amount: number,
  fromUnit: string,
  toUnit: string,
  ingredientName?: string
): number | null {
  const from = normalizeUnit(fromUnit);
  const to = normalizeUnit(toUnit);
  if (!from || !to) return null;

  const fromType = classifyUnit(from);
  const toType = classifyUnit(to);
  if (fromType === 'unknown' || toType === 'unknown') return null;

  if (fromType === 'volume' && toType === 'volume') {
    const ml = amount * VOLUME_TO_ML[from];
    return ml / VOLUME_TO_ML[to];
  }

  if (fromType === 'weight' && toType === 'weight') {
    const g = amount * WEIGHT_TO_G[from];
    return g / WEIGHT_TO_G[to];
  }

  if (!ingredientName) return null;
  const gPerCup = getDensity(ingredientName);
  if (!gPerCup) return null;

  const gPerMl = gPerCup / VOLUME_TO_ML['cup'];

  if (fromType === 'volume' && toType === 'weight') {
    const ml = amount * VOLUME_TO_ML[from];
    const g = ml * gPerMl;
    return g / WEIGHT_TO_G[to];
  }

  if (fromType === 'weight' && toType === 'volume') {
    const g = amount * WEIGHT_TO_G[from];
    const ml = g / gPerMl;
    return ml / VOLUME_TO_ML[to];
  }

  return null;
}

function pickVolumeUnitUS(ml: number): string {
  const tsp = ml / VOLUME_TO_ML['tsp'];
  const tbsp = ml / VOLUME_TO_ML['tbsp'];
  if (tsp < 1) return 'tsp';
  if (tbsp < 4) return tsp < 3 ? 'tsp' : 'tbsp';
  return 'cup';
}

function pickVolumeUnitMetric(ml: number): string {
  if (ml >= 1000) return 'L';
  return 'ml';
}

function pickWeightUnitUS(g: number): string {
  const oz = g / WEIGHT_TO_G['oz'];
  if (oz >= 16) return 'lb';
  return 'oz';
}

function pickWeightUnitMetric(g: number): string {
  if (g >= 1000) return 'kg';
  return 'g';
}

export function convertToSystem(
  amount: number,
  unit: string,
  ingredientName: string,
  targetSystem: UnitSystem
): { amount: number; unit: string } | null {
  const normalized = normalizeUnit(unit);
  if (!normalized) return null;

  const unitType = classifyUnit(normalized);
  if (unitType === 'unknown') return null;

  if (unitType === 'volume') {
    const ml = amount * VOLUME_TO_ML[normalized];
    const targetUnit =
      targetSystem === 'us' ? pickVolumeUnitUS(ml) : pickVolumeUnitMetric(ml);
    return { amount: ml / VOLUME_TO_ML[targetUnit], unit: targetUnit };
  }

  if (unitType === 'weight') {
    const g = amount * WEIGHT_TO_G[normalized];
    const targetUnit =
      targetSystem === 'us' ? pickWeightUnitUS(g) : pickWeightUnitMetric(g);
    return { amount: g / WEIGHT_TO_G[targetUnit], unit: targetUnit };
  }

  return null;
}

// Fraction map for US-friendly display
const FRACTION_MAP: Record<string, string> = {
  '0.25': '¼',
  '0.33': '⅓',
  '0.5': '½',
  '0.67': '⅔',
  '0.75': '¾',
};

export function formatAmount(amount: number): string {
  if (amount >= 10) return Math.round(amount).toString();

  const whole = Math.floor(amount);
  const frac = amount - whole;

  for (const [key, symbol] of Object.entries(FRACTION_MAP)) {
    if (Math.abs(frac - parseFloat(key)) < 0.02) {
      return whole > 0 ? `${whole}${symbol}` : symbol;
    }
  }

  if (amount >= 1) return amount.toFixed(1).replace(/\.0$/, '');
  return amount.toFixed(2).replace(/0$/, '').replace(/\.$/, '');
}
