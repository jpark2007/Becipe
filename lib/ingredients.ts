// lib/ingredients.ts
// Static ingredient dictionary for Add-recipe autocomplete.
// Free, offline, no API dependency. Upgrade to a Supabase table later if needed.

export const INGREDIENTS: string[] = [
  // Proteins — meat
  'chicken breast', 'chicken thigh', 'chicken wings', 'chicken drumstick', 'whole chicken',
  'ground beef', 'beef chuck', 'beef brisket', 'beef ribs', 'ribeye steak', 'sirloin steak',
  'flank steak', 'skirt steak', 'filet mignon', 'ground turkey', 'turkey breast',
  'pork shoulder', 'pork belly', 'pork chop', 'pork loin', 'pork ribs', 'spare ribs',
  'baby back ribs', 'ham', 'prosciutto', 'pancetta', 'bacon', 'chorizo', 'sausage',
  'italian sausage', 'bratwurst', 'lamb chop', 'lamb shoulder', 'ground lamb',
  'rack of lamb', 'leg of lamb', 'duck breast', 'duck leg', 'veal', 'bison',
  // Proteins — seafood
  'salmon fillet', 'salmon steak', 'tuna steak', 'tuna', 'cod', 'halibut', 'tilapia',
  'sea bass', 'snapper', 'mahi mahi', 'swordfish', 'trout', 'sardine', 'anchovy',
  'shrimp', 'prawns', 'lobster', 'crab', 'dungeness crab', 'king crab', 'scallop',
  'clam', 'mussel', 'oyster', 'squid', 'calamari', 'octopus', 'crayfish', 'abalone',
  // Proteins — plant
  'tofu', 'firm tofu', 'silken tofu', 'extra firm tofu', 'tempeh', 'seitan',
  'edamame', 'chickpea', 'black bean', 'kidney bean', 'pinto bean', 'white bean',
  'cannellini bean', 'navy bean', 'lentil', 'red lentil', 'green lentil', 'split pea',
  'fava bean', 'black-eyed pea', 'adzuki bean', 'mung bean',
  // Proteins — eggs
  'egg', 'egg white', 'egg yolk', 'quail egg',
  // Vegetables — leafy greens
  'spinach', 'baby spinach', 'kale', 'arugula', 'romaine lettuce', 'iceberg lettuce',
  'butter lettuce', 'mixed greens', 'swiss chard', 'collard greens', 'bok choy',
  'baby bok choy', 'watercress', 'endive', 'radicchio', 'cabbage', 'red cabbage',
  'napa cabbage', 'brussels sprouts',
  // Vegetables — alliums
  'onion', 'yellow onion', 'red onion', 'white onion', 'green onion', 'scallion',
  'shallot', 'leek', 'chive', 'garlic', 'garlic clove', 'garlic powder',
  // Vegetables — root vegetables
  'carrot', 'baby carrot', 'parsnip', 'turnip', 'rutabaga', 'beet', 'golden beet',
  'radish', 'daikon', 'celeriac', 'sweet potato', 'yam', 'potato', 'russet potato',
  'yukon gold potato', 'red potato', 'fingerling potato',
  // Vegetables — nightshades
  'tomato', 'cherry tomato', 'grape tomato', 'roma tomato', 'heirloom tomato',
  'sun-dried tomato', 'tomatillo', 'bell pepper', 'red bell pepper', 'yellow bell pepper',
  'green bell pepper', 'orange bell pepper', 'jalapeño', 'serrano pepper', 'poblano',
  'chipotle', 'cayenne pepper', 'habanero', 'eggplant', 'japanese eggplant',
  // Vegetables — cruciferous
  'broccoli', 'broccoli floret', 'cauliflower', 'broccolini', 'romanesco',
  // Vegetables — squash
  'zucchini', 'yellow squash', 'butternut squash', 'acorn squash', 'spaghetti squash',
  'delicata squash', 'kabocha squash', 'pumpkin', 'sugar pumpkin',
  // Vegetables — other
  'asparagus', 'artichoke', 'artichoke heart', 'fennel', 'celery', 'celery stalk',
  'cucumber', 'english cucumber', 'persian cucumber', 'corn', 'corn kernel',
  'mushroom', 'cremini mushroom', 'button mushroom', 'portobello mushroom',
  'shiitake mushroom', 'oyster mushroom', 'maitake mushroom', 'chanterelle',
  'porcini mushroom', 'enoki mushroom', 'pea', 'snow pea', 'sugar snap pea',
  'green bean', 'wax bean', 'okra', 'avocado',
  // Fruits
  'apple', 'granny smith apple', 'honeycrisp apple', 'fuji apple', 'pear', 'asian pear',
  'orange', 'blood orange', 'tangerine', 'mandarin', 'clementine', 'grapefruit',
  'lemon', 'lime', 'yuzu', 'pomelo', 'banana', 'plantain', 'mango', 'papaya',
  'pineapple', 'coconut', 'kiwi', 'guava', 'passionfruit', 'dragon fruit',
  'strawberry', 'raspberry', 'blueberry', 'blackberry', 'cranberry', 'cherry',
  'sour cherry', 'grape', 'red grape', 'green grape', 'fig', 'date', 'apricot',
  'peach', 'nectarine', 'plum', 'prune', 'watermelon', 'cantaloupe', 'honeydew',
  'pomegranate', 'persimmon', 'lychee', 'rambutan', 'jackfruit',
  // Dairy
  'milk', 'whole milk', 'skim milk', 'oat milk', 'almond milk', 'coconut milk',
  'soy milk', 'heavy cream', 'heavy whipping cream', 'whipping cream', 'half and half',
  'sour cream', 'crème fraîche', 'cream cheese', 'mascarpone', 'ricotta',
  'cottage cheese', 'butter', 'unsalted butter', 'salted butter', 'ghee',
  'cheddar cheese', 'sharp cheddar', 'mozzarella', 'fresh mozzarella', 'burrata',
  'parmesan', 'pecorino romano', 'gruyère', 'swiss cheese', 'gouda', 'brie', 'camembert',
  'feta cheese', 'goat cheese', 'blue cheese', 'gorgonzola', 'fontina', 'provolone',
  'havarti', 'manchego', 'asiago', 'emmental', 'monterey jack', 'pepper jack',
  'yogurt', 'greek yogurt', 'plain yogurt', 'kefir',
  // Grains and starches
  'all-purpose flour', 'bread flour', 'whole wheat flour', 'cake flour', 'almond flour',
  'rice flour', 'cornmeal', 'cornstarch', 'arrowroot', 'tapioca starch',
  'white rice', 'brown rice', 'jasmine rice', 'basmati rice', 'arborio rice',
  'short-grain rice', 'sushi rice', 'wild rice', 'black rice',
  'pasta', 'spaghetti', 'penne', 'rigatoni', 'fettuccine', 'linguine', 'tagliatelle',
  'lasagna noodle', 'farfalle', 'fusilli', 'orzo', 'orecchiette', 'cavatappi',
  'rice noodle', 'glass noodle', 'udon noodle', 'soba noodle', 'ramen noodle',
  'egg noodle', 'lo mein noodle',
  'bread', 'sourdough bread', 'baguette', 'brioche', 'ciabatta', 'focaccia',
  'pita bread', 'naan', 'tortilla', 'corn tortilla', 'flour tortilla',
  'oat', 'rolled oat', 'steel-cut oat', 'quinoa', 'farro', 'bulgur', 'barley',
  'millet', 'couscous', 'polenta', 'semolina', 'buckwheat', 'amaranth',
  'breadcrumb', 'panko', 'crouton',
  // Pantry — oils and fats
  'olive oil', 'extra virgin olive oil', 'vegetable oil', 'canola oil', 'avocado oil',
  'sesame oil', 'toasted sesame oil', 'coconut oil', 'grapeseed oil', 'peanut oil',
  'sunflower oil', 'lard', 'schmaltz', 'shortening',
  // Pantry — vinegars and acids
  'white wine vinegar', 'red wine vinegar', 'apple cider vinegar', 'balsamic vinegar',
  'sherry vinegar', 'rice vinegar', 'distilled white vinegar', 'champagne vinegar',
  'lemon juice', 'lime juice', 'orange juice',
  // Pantry — sauces and condiments
  'soy sauce', 'tamari', 'coconut aminos', 'fish sauce', 'oyster sauce',
  'hoisin sauce', 'teriyaki sauce', 'worcestershire sauce', 'hot sauce', 'sriracha',
  'gochujang', 'doenjang', 'miso paste', 'white miso', 'red miso',
  'tahini', 'harissa', 'sambal oelek', 'XO sauce',
  'tomato paste', 'tomato sauce', 'crushed tomato', 'diced tomato', 'tomato puree',
  'ketchup', 'mustard', 'dijon mustard', 'whole grain mustard', 'yellow mustard',
  'mayonnaise', 'aioli',
  // Pantry — sweeteners
  'sugar', 'white sugar', 'brown sugar', 'light brown sugar', 'dark brown sugar',
  'powdered sugar', 'confectioners sugar', 'raw sugar', 'turbinado sugar',
  'honey', 'maple syrup', 'agave nectar', 'molasses', 'corn syrup',
  'coconut sugar', 'date syrup',
  // Pantry — spices and seasonings
  'salt', 'kosher salt', 'sea salt', 'flaky sea salt', 'black pepper',
  'white pepper', 'red pepper flake', 'paprika', 'smoked paprika', 'sweet paprika',
  'cumin', 'cumin seed', 'coriander', 'coriander seed', 'turmeric',
  'cinnamon', 'cinnamon stick', 'cardamom', 'clove', 'nutmeg', 'allspice',
  'star anise', 'fennel seed', 'caraway seed', 'mustard seed', 'nigella seed',
  'saffron', 'sumac', 'za\'atar', 'ras el hanout', 'garam masala', 'curry powder',
  'chili powder', 'ancho chili powder', 'chipotle powder', 'cayenne', 'five spice',
  'old bay', 'italian seasoning', 'herbes de provence', 'bay leaf', 'vanilla extract',
  'almond extract', 'baking soda', 'baking powder', 'yeast', 'cream of tartar',
  // Herbs — fresh
  'basil', 'flat-leaf parsley', 'curly parsley', 'cilantro', 'mint', 'tarragon',
  'thyme', 'rosemary', 'oregano', 'sage', 'dill', 'chervil', 'marjoram', 'lemongrass',
  'kaffir lime leaf', 'curry leaf', 'makrut lime leaf',
  // Herbs — dried
  'dried thyme', 'dried oregano', 'dried basil', 'dried rosemary', 'dried sage',
  'dried dill', 'dried marjoram',
  // Nuts and seeds
  'almond', 'sliced almond', 'walnut', 'pecan', 'cashew', 'pistachio', 'pine nut',
  'hazelnut', 'macadamia nut', 'brazil nut', 'peanut', 'chestnut',
  'sesame seed', 'white sesame seed', 'black sesame seed', 'poppy seed',
  'sunflower seed', 'pumpkin seed', 'flaxseed', 'chia seed', 'hemp seed',
  'peanut butter', 'almond butter', 'sunflower seed butter',
  // Stocks and broths
  'chicken broth', 'chicken stock', 'vegetable broth', 'vegetable stock',
  'beef broth', 'beef stock', 'fish stock', 'dashi', 'kombu', 'bonito flake',
  // Alcohol
  'white wine', 'dry white wine', 'red wine', 'dry red wine', 'rosé wine',
  'champagne', 'sake', 'mirin', 'shaoxing wine', 'dry sherry', 'brandy',
  'cognac', 'bourbon', 'whiskey', 'rum', 'vodka', 'beer', 'stout', 'lager',
  // Other pantry
  'chocolate', 'dark chocolate', 'milk chocolate', 'white chocolate',
  'cocoa powder', 'dutch-process cocoa', 'chocolate chip',
  'canned coconut milk', 'coconut cream', 'desiccated coconut', 'coconut flake',
  'dried apricot', 'raisin', 'golden raisin', 'dried cranberry', 'dried cherry',
  'dried fig', 'dried date', 'dried plum',
  'capers', 'caper', 'green olive', 'kalamata olive', 'black olive', 'olive',
  'ginger', 'fresh ginger', 'ginger powder', 'ground ginger',
  'jalapeño pepper', 'canned jalapeño', 'chipotle in adobo', 'adobo sauce',
  'gelatin', 'agar agar', 'pectin',
  'bread crumb', 'panko bread crumb',
  'water', 'sparkling water', 'coconut water',
  'coffee', 'espresso', 'matcha', 'green tea', 'black tea', 'chai',
  'vanilla bean', 'vanilla pod',
  'truffle oil', 'truffle',
  'mirin', 'rice wine', 'plum wine',
  'apple juice', 'grape juice', 'pomegranate juice', 'tomato juice',
];

// Deduplicate + sort alphabetically for consistent lookup
export const INGREDIENTS_SORTED = Array.from(new Set(INGREDIENTS)).sort();
