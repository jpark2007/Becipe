// lib/ingredient-emoji.ts
// Lightweight ingredient -> emoji lookup. Used by recipe detail ingredient list.
// Returns null for unknown ingredients — caller should render a bullet instead.

const EMOJI_MAP: Record<string, string> = {
  // Dairy & eggs
  egg: '🥚',
  eggs: '🥚',
  butter: '🧈',
  milk: '🥛',
  cream: '🥛',
  yogurt: '🥛',
  cheese: '🧀',
  parmesan: '🧀',
  mozzarella: '🧀',
  cheddar: '🧀',
  feta: '🧀',
  ricotta: '🧀',

  // Pantry staples
  salt: '🧂',
  pepper: '🌶️',
  sugar: '🍬',
  flour: '🌾',
  rice: '🍚',
  bread: '🍞',
  pasta: '🍝',
  noodles: '🍜',
  oil: '🫒',
  'olive oil': '🫒',
  'vegetable oil': '🫒',
  vinegar: '🍶',
  honey: '🍯',
  syrup: '🍯',
  'maple syrup': '🍯',
  'soy sauce': '🍶',
  'fish sauce': '🍶',
  ketchup: '🥫',
  mustard: '🥫',
  mayonnaise: '🥫',
  mayo: '🥫',

  // Aromatics
  onion: '🧅',
  onions: '🧅',
  shallot: '🧅',
  garlic: '🧄',
  ginger: '🫚',
  scallion: '🌱',
  scallions: '🌱',
  leek: '🌱',
  chive: '🌱',
  chives: '🌱',

  // Vegetables
  tomato: '🍅',
  tomatoes: '🍅',
  potato: '🥔',
  potatoes: '🥔',
  carrot: '🥕',
  carrots: '🥕',
  'bell pepper': '🫑',
  pepper_veg: '🫑',
  chili: '🌶️',
  jalapeno: '🌶️',
  jalapeño: '🌶️',
  cucumber: '🥒',
  zucchini: '🥒',
  squash: '🎃',
  pumpkin: '🎃',
  eggplant: '🍆',
  broccoli: '🥦',
  cauliflower: '🥦',
  lettuce: '🥬',
  spinach: '🥬',
  kale: '🥬',
  cabbage: '🥬',
  arugula: '🥬',
  corn: '🌽',
  mushroom: '🍄',
  mushrooms: '🍄',
  avocado: '🥑',
  olive: '🫒',
  olives: '🫒',
  asparagus: '🌿',
  celery: '🌿',
  peas: '🌱',
  beans: '🫘',
  'green beans': '🫛',
  'black beans': '🫘',
  chickpeas: '🫘',
  lentils: '🫘',

  // Fruit
  lemon: '🍋',
  lime: '🍋',
  orange: '🍊',
  grapefruit: '🍊',
  apple: '🍎',
  pear: '🍐',
  banana: '🍌',
  strawberry: '🍓',
  strawberries: '🍓',
  blueberry: '🫐',
  blueberries: '🫐',
  raspberry: '🫐',
  blackberry: '🫐',
  grape: '🍇',
  grapes: '🍇',
  watermelon: '🍉',
  melon: '🍈',
  peach: '🍑',
  cherry: '🍒',
  cherries: '🍒',
  mango: '🥭',
  pineapple: '🍍',
  coconut: '🥥',
  kiwi: '🥝',

  // Proteins
  chicken: '🍗',
  beef: '🥩',
  steak: '🥩',
  pork: '🥓',
  bacon: '🥓',
  ham: '🍖',
  sausage: '🌭',
  lamb: '🍖',
  turkey: '🦃',
  fish: '🐟',
  salmon: '🐟',
  tuna: '🐟',
  cod: '🐟',
  shrimp: '🦐',
  prawn: '🦐',
  lobster: '🦞',
  crab: '🦀',
  scallop: '🐚',
  mussel: '🐚',
  clam: '🐚',
  oyster: '🦪',
  tofu: '🥡',
  tempeh: '🥡',

  // Herbs & spices
  basil: '🌿',
  parsley: '🌿',
  cilantro: '🌿',
  coriander: '🌿',
  mint: '🌿',
  rosemary: '🌿',
  thyme: '🌿',
  oregano: '🌿',
  sage: '🌿',
  dill: '🌿',
  bay: '🌿',
  'bay leaf': '🌿',
  paprika: '🌶️',
  cumin: '🌾',
  cinnamon: '🌾',
  nutmeg: '🌾',
  clove: '🌾',
  cloves: '🌾',
  turmeric: '🌾',
  cardamom: '🌾',
  saffron: '🌾',
  vanilla: '🌾',

  // Nuts & seeds
  almond: '🥜',
  almonds: '🥜',
  peanut: '🥜',
  peanuts: '🥜',
  walnut: '🥜',
  walnuts: '🥜',
  pecan: '🥜',
  pecans: '🥜',
  cashew: '🥜',
  cashews: '🥜',
  pistachio: '🥜',
  pistachios: '🥜',
  hazelnut: '🥜',
  sesame: '🌱',
  'sesame seed': '🌱',
  'sesame seeds': '🌱',

  // Drinks / liquids
  water: '💧',
  stock: '🥣',
  broth: '🥣',
  wine: '🍷',
  'white wine': '🍷',
  'red wine': '🍷',
  beer: '🍺',
  coffee: '☕',
  tea: '🍵',

  // Sweet stuff
  chocolate: '🍫',
  cocoa: '🍫',
};

// Strip common descriptor words so "kosher salt" -> "salt".
const STRIP_WORDS = new Set([
  'kosher', 'sea', 'fine', 'coarse', 'flaky', 'unsalted', 'salted',
  'yellow', 'red', 'white', 'green', 'black', 'brown', 'pink',
  'sweet', 'bitter', 'sour', 'spicy', 'hot', 'mild',
  'fresh', 'dried', 'frozen', 'canned', 'cooked', 'raw',
  'ground', 'whole', 'chopped', 'diced', 'minced', 'sliced', 'grated', 'shredded',
  'large', 'small', 'medium', 'extra',
  'virgin', 'plain', 'pure',
  'all-purpose', 'self-rising',
  'boneless', 'skinless',
  'organic', 'crushed', 'toasted',
]);

function normalize(name: string): string {
  return name
    .toLowerCase()
    .replace(/[.,()\/]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 0 && !STRIP_WORDS.has(w))
    .join(' ')
    .trim();
}

export function emojiFor(ingredientName: string | null | undefined): string | null {
  if (!ingredientName) return null;
  const normalized = normalize(ingredientName);
  if (!normalized) return null;

  // Try the full normalized string first (handles "olive oil", "soy sauce").
  if (EMOJI_MAP[normalized]) return EMOJI_MAP[normalized];

  // Fall back to each individual word, last word first (most specific noun).
  const words = normalized.split(/\s+/);
  for (let i = words.length - 1; i >= 0; i--) {
    if (EMOJI_MAP[words[i]]) return EMOJI_MAP[words[i]];
  }
  return null;
}
