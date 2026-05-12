-- Adds ~28 more seed recipes to the @becipe account covering desserts, baking,
-- breakfast, international, snacks, and drinks.
-- Idempotent: uses ON CONFLICT (id) DO NOTHING throughout.

insert into recipes (
  id, created_by, title, description, cuisine, difficulty,
  prep_time_min, cook_time_min, servings,
  cover_image_url, palate_vector, ingredients, steps, is_public, tags
) values

-- ===== DESSERTS & BAKING =====

-- 1. Classic Chocolate Chip Cookies
(
  '00000000-0000-0000-0000-000000000051',
  '00000000-0000-0000-0000-0000000becee',
  'Classic Chocolate Chip Cookies',
  'Crispy edges, chewy centers, and pools of melted chocolate in every bite.',
  'American', 'easy', 15, 12, 24,
  'https://image.pollinations.ai/prompt/overhead%20food%20photography%20chocolate%20chip%20cookies%20golden%20brown%20cooling%20rack%20parchment?width=800&height=800&seed=2001&nologo=true',
  '{"salt":40,"sweet":80,"umami":15,"spice":5,"acid":5}'::jsonb,
  '[{"amount":"2 1/4","unit":"cups","name":"all-purpose flour"},{"amount":"1","unit":"cup","name":"unsalted butter"},{"amount":"3/4","unit":"cup","name":"brown sugar"},{"amount":"1/2","unit":"cup","name":"granulated sugar"},{"amount":"2","unit":"","name":"eggs"},{"amount":"1","unit":"tsp","name":"vanilla extract"},{"amount":"1","unit":"tsp","name":"baking soda"},{"amount":"2","unit":"cups","name":"chocolate chips"},{"amount":"1","unit":"tsp","name":"flaky sea salt"}]'::jsonb,
  '[{"order":1,"instruction":"Cream butter and sugars until light and fluffy. Beat in eggs one at a time, then vanilla."},{"order":2,"instruction":"Whisk flour, baking soda, and salt in a bowl. Gradually mix into wet ingredients. Fold in chocolate chips."},{"order":3,"instruction":"Scoop tablespoon-sized balls onto parchment-lined baking sheets. Chill 30 minutes if possible."},{"order":4,"instruction":"Bake at 375F (190C) for 10-12 minutes until edges are golden but centers look underdone. Cool on pan 5 minutes."}]'::jsonb,
  true, ARRAY['American','dessert','baking','cookies']
),

-- 2. New York Cheesecake
(
  '00000000-0000-0000-0000-000000000052',
  '00000000-0000-0000-0000-0000000becee',
  'New York Cheesecake',
  'Dense, creamy, and impossibly rich -- the benchmark against which all cheesecakes are measured.',
  'American', 'medium', 20, 70, 12,
  'https://image.pollinations.ai/prompt/overhead%20food%20photography%20new%20york%20cheesecake%20smooth%20top%20white%20plate%20berry%20garnish?width=800&height=800&seed=2002&nologo=true',
  '{"salt":30,"sweet":75,"umami":10,"spice":5,"acid":25}'::jsonb,
  '[{"amount":"900","unit":"g","name":"cream cheese"},{"amount":"1","unit":"cup","name":"sugar"},{"amount":"5","unit":"","name":"eggs"},{"amount":"2","unit":"tsp","name":"vanilla extract"},{"amount":"1/4","unit":"cup","name":"all-purpose flour"},{"amount":"1","unit":"cup","name":"sour cream"},{"amount":"1 1/2","unit":"cups","name":"graham cracker crumbs"},{"amount":"5","unit":"tbsp","name":"unsalted butter"}]'::jsonb,
  '[{"order":1,"instruction":"Mix graham cracker crumbs with melted butter. Press into the bottom of a 9-inch springform pan. Bake at 325F (160C) for 10 minutes."},{"order":2,"instruction":"Beat cream cheese until smooth. Add sugar, then eggs one at a time. Mix in flour, sour cream, and vanilla until just combined."},{"order":3,"instruction":"Pour filling over crust. Wrap pan bottom in foil and place in a water bath. Bake at 325F for 60-70 minutes until edges are set but center jiggles slightly."},{"order":4,"instruction":"Turn oven off, crack door open, and let cheesecake cool inside for 1 hour. Refrigerate at least 4 hours before serving."}]'::jsonb,
  true, ARRAY['American','dessert','baking','cheesecake']
),

-- 3. Banana Bread
(
  '00000000-0000-0000-0000-000000000053',
  '00000000-0000-0000-0000-0000000becee',
  'Banana Bread',
  'Moist, tender banana bread with a caramelized crust -- the riper the bananas, the better.',
  'American', 'easy', 10, 55, 8,
  'https://image.pollinations.ai/prompt/overhead%20food%20photography%20banana%20bread%20sliced%20golden%20crust%20wooden%20cutting%20board?width=800&height=800&seed=2003&nologo=true',
  '{"salt":25,"sweet":70,"umami":10,"spice":15,"acid":10}'::jsonb,
  '[{"amount":"3","unit":"","name":"ripe bananas"},{"amount":"1/3","unit":"cup","name":"melted butter"},{"amount":"3/4","unit":"cup","name":"sugar"},{"amount":"1","unit":"","name":"egg"},{"amount":"1","unit":"tsp","name":"vanilla extract"},{"amount":"1 1/2","unit":"cups","name":"all-purpose flour"},{"amount":"1","unit":"tsp","name":"baking soda"},{"amount":"1/2","unit":"tsp","name":"cinnamon"}]'::jsonb,
  '[{"order":1,"instruction":"Mash bananas in a large bowl. Stir in melted butter, sugar, egg, and vanilla."},{"order":2,"instruction":"Whisk flour, baking soda, salt, and cinnamon. Fold into banana mixture until just combined -- do not overmix."},{"order":3,"instruction":"Pour into a greased 9x5-inch loaf pan. Bake at 350F (175C) for 50-55 minutes until a toothpick comes out clean."},{"order":4,"instruction":"Cool in pan 10 minutes, then turn out onto a wire rack. Slice and serve warm or at room temperature."}]'::jsonb,
  true, ARRAY['American','dessert','baking','breakfast']
),

-- 4. Tiramisu
(
  '00000000-0000-0000-0000-000000000054',
  '00000000-0000-0000-0000-0000000becee',
  'Tiramisu',
  'Espresso-soaked ladyfingers layered with airy mascarpone cream and dusted with cocoa.',
  'Italian', 'medium', 30, 0, 8,
  'https://image.pollinations.ai/prompt/overhead%20food%20photography%20tiramisu%20cocoa%20dusted%20glass%20dish%20espresso%20cup?width=800&height=800&seed=2004&nologo=true',
  '{"salt":15,"sweet":70,"umami":10,"spice":5,"acid":10}'::jsonb,
  '[{"amount":"500","unit":"g","name":"mascarpone cheese"},{"amount":"4","unit":"","name":"eggs"},{"amount":"1/2","unit":"cup","name":"sugar"},{"amount":"300","unit":"ml","name":"strong espresso"},{"amount":"2","unit":"tbsp","name":"Marsala wine"},{"amount":"200","unit":"g","name":"ladyfinger cookies"},{"amount":"2","unit":"tbsp","name":"unsweetened cocoa powder"}]'::jsonb,
  '[{"order":1,"instruction":"Separate eggs. Whisk yolks with sugar until thick and pale. Fold in mascarpone until smooth."},{"order":2,"instruction":"Whip egg whites to stiff peaks. Gently fold into the mascarpone mixture in two additions."},{"order":3,"instruction":"Combine espresso and Marsala. Quickly dip ladyfingers and arrange in a single layer in a dish. Spread half the cream on top. Repeat layers."},{"order":4,"instruction":"Cover and refrigerate at least 6 hours or overnight. Dust generously with cocoa powder before serving."}]'::jsonb,
  true, ARRAY['Italian','dessert','no-bake']
),

-- 5. Lemon Bars
(
  '00000000-0000-0000-0000-000000000055',
  '00000000-0000-0000-0000-0000000becee',
  'Lemon Bars',
  'Tangy lemon curd on a buttery shortbread crust, finished with a cloud of powdered sugar.',
  'American', 'easy', 15, 40, 16,
  'https://image.pollinations.ai/prompt/overhead%20food%20photography%20lemon%20bars%20powdered%20sugar%20dusted%20cut%20into%20squares?width=800&height=800&seed=2005&nologo=true',
  '{"salt":20,"sweet":70,"umami":5,"spice":0,"acid":80}'::jsonb,
  '[{"amount":"1","unit":"cup","name":"unsalted butter"},{"amount":"1/2","unit":"cup","name":"powdered sugar"},{"amount":"2","unit":"cups","name":"all-purpose flour"},{"amount":"4","unit":"","name":"eggs"},{"amount":"1 1/2","unit":"cups","name":"granulated sugar"},{"amount":"1/2","unit":"cup","name":"fresh lemon juice"},{"amount":"2","unit":"tbsp","name":"lemon zest"}]'::jsonb,
  '[{"order":1,"instruction":"Mix softened butter, powdered sugar, and 1 3/4 cups flour until a dough forms. Press into a 9x13 pan. Bake at 350F (175C) for 20 minutes until lightly golden."},{"order":2,"instruction":"Whisk eggs, sugar, remaining flour, lemon juice, and zest until smooth. Pour over hot crust."},{"order":3,"instruction":"Bake another 20 minutes until filling is set and no longer jiggles. Cool completely in pan."},{"order":4,"instruction":"Dust with powdered sugar and cut into squares. Refrigerate leftovers."}]'::jsonb,
  true, ARRAY['American','dessert','baking','citrus']
),

-- 6. Cinnamon Rolls
(
  '00000000-0000-0000-0000-000000000056',
  '00000000-0000-0000-0000-0000000becee',
  'Cinnamon Rolls',
  'Soft, pillowy rolls swirled with cinnamon-brown sugar butter and dripping with cream cheese frosting.',
  'American', 'hard', 40, 25, 12,
  'https://image.pollinations.ai/prompt/overhead%20food%20photography%20cinnamon%20rolls%20cream%20cheese%20frosting%20baking%20pan?width=800&height=800&seed=2006&nologo=true',
  '{"salt":30,"sweet":85,"umami":5,"spice":40,"acid":5}'::jsonb,
  '[{"amount":"3","unit":"cups","name":"all-purpose flour"},{"amount":"1","unit":"packet","name":"instant yeast"},{"amount":"3/4","unit":"cup","name":"warm milk"},{"amount":"1/4","unit":"cup","name":"unsalted butter"},{"amount":"1/2","unit":"cup","name":"brown sugar"},{"amount":"2","unit":"tbsp","name":"ground cinnamon"},{"amount":"4","unit":"oz","name":"cream cheese"},{"amount":"1","unit":"cup","name":"powdered sugar"}]'::jsonb,
  '[{"order":1,"instruction":"Combine flour, yeast, sugar, and salt. Add warm milk, egg, and melted butter. Knead 8 minutes until smooth. Rise 1 hour."},{"order":2,"instruction":"Roll dough into a large rectangle. Spread softened butter, then sprinkle brown sugar and cinnamon evenly. Roll up tightly from the long side."},{"order":3,"instruction":"Cut into 12 pieces. Place in a buttered 9x13 pan. Cover and rise 30 minutes. Bake at 375F (190C) for 22-25 minutes."},{"order":4,"instruction":"Beat cream cheese with powdered sugar and a splash of vanilla. Spread over warm rolls and serve immediately."}]'::jsonb,
  true, ARRAY['American','dessert','baking','breakfast']
),

-- 7. Creme Brulee
(
  '00000000-0000-0000-0000-000000000057',
  '00000000-0000-0000-0000-0000000becee',
  'Creme Brulee',
  'Silky vanilla custard beneath a shattering layer of caramelized sugar.',
  'French', 'medium', 15, 45, 4,
  'https://image.pollinations.ai/prompt/overhead%20food%20photography%20creme%20brulee%20caramelized%20sugar%20top%20white%20ramekin?width=800&height=800&seed=2007&nologo=true',
  '{"salt":15,"sweet":75,"umami":10,"spice":0,"acid":5}'::jsonb,
  '[{"amount":"2","unit":"cups","name":"heavy cream"},{"amount":"5","unit":"","name":"egg yolks"},{"amount":"1/2","unit":"cup","name":"granulated sugar"},{"amount":"1","unit":"","name":"vanilla bean"},{"amount":"2","unit":"tbsp","name":"superfine sugar"}]'::jsonb,
  '[{"order":1,"instruction":"Heat cream with scraped vanilla bean seeds and pod until steaming. Remove pod."},{"order":2,"instruction":"Whisk yolks and sugar until pale. Slowly pour hot cream into yolks while whisking constantly. Strain into ramekins."},{"order":3,"instruction":"Place ramekins in a baking dish. Add hot water halfway up sides. Bake at 325F (160C) for 40-45 minutes until set but jiggly in center. Chill at least 2 hours."},{"order":4,"instruction":"Sprinkle superfine sugar evenly on top. Torch until deep amber and crackling. Serve within 10 minutes."}]'::jsonb,
  true, ARRAY['French','dessert','custard']
),

-- 8. Apple Pie
(
  '00000000-0000-0000-0000-000000000058',
  '00000000-0000-0000-0000-0000000becee',
  'Apple Pie',
  'Flaky, buttery double-crust pie loaded with cinnamon-spiced apple slices.',
  'American', 'hard', 30, 55, 8,
  'https://image.pollinations.ai/prompt/overhead%20food%20photography%20apple%20pie%20golden%20lattice%20crust%20rustic%20table?width=800&height=800&seed=2008&nologo=true',
  '{"salt":20,"sweet":75,"umami":5,"spice":35,"acid":40}'::jsonb,
  '[{"amount":"6","unit":"","name":"Granny Smith apples"},{"amount":"3/4","unit":"cup","name":"sugar"},{"amount":"2","unit":"tbsp","name":"all-purpose flour"},{"amount":"1","unit":"tsp","name":"cinnamon"},{"amount":"1/4","unit":"tsp","name":"nutmeg"},{"amount":"1","unit":"tbsp","name":"lemon juice"},{"amount":"2","unit":"","name":"pie dough rounds"},{"amount":"1","unit":"","name":"egg"},{"amount":"2","unit":"tbsp","name":"unsalted butter"}]'::jsonb,
  '[{"order":1,"instruction":"Peel, core, and slice apples. Toss with sugar, flour, cinnamon, nutmeg, and lemon juice."},{"order":2,"instruction":"Line a 9-inch pie plate with one dough round. Fill with apple mixture and dot with butter."},{"order":3,"instruction":"Top with second crust or lattice. Crimp edges. Cut vents in top. Brush with beaten egg and sprinkle with sugar."},{"order":4,"instruction":"Bake at 425F (220C) for 15 minutes, then reduce to 350F (175C) and bake 40 more minutes until golden and bubbling. Cool 2 hours before slicing."}]'::jsonb,
  true, ARRAY['American','dessert','baking','pie','fruit']
),

-- ===== BREAKFAST =====

-- 9. Fluffy Pancakes
(
  '00000000-0000-0000-0000-000000000059',
  '00000000-0000-0000-0000-0000000becee',
  'Fluffy Pancakes',
  'Thick, tender buttermilk pancakes that puff up tall on the griddle.',
  'American', 'easy', 10, 15, 4,
  'https://image.pollinations.ai/prompt/overhead%20food%20photography%20fluffy%20pancakes%20stack%20maple%20syrup%20butter%20berries?width=800&height=800&seed=2009&nologo=true',
  '{"salt":25,"sweet":60,"umami":5,"spice":5,"acid":15}'::jsonb,
  '[{"amount":"1 1/2","unit":"cups","name":"all-purpose flour"},{"amount":"1","unit":"cup","name":"buttermilk"},{"amount":"1","unit":"","name":"egg"},{"amount":"2","unit":"tbsp","name":"sugar"},{"amount":"2","unit":"tbsp","name":"melted butter"},{"amount":"1 1/2","unit":"tsp","name":"baking powder"},{"amount":"1/2","unit":"tsp","name":"baking soda"}]'::jsonb,
  '[{"order":1,"instruction":"Whisk flour, sugar, baking powder, baking soda, and salt in a bowl."},{"order":2,"instruction":"In another bowl, whisk buttermilk, egg, and melted butter. Pour into dry ingredients and stir until just combined -- lumps are fine."},{"order":3,"instruction":"Heat a griddle or pan over medium-low. Pour 1/4 cup batter per pancake. Cook until bubbles form on surface and edges look set, about 2-3 minutes. Flip and cook 1-2 minutes more."},{"order":4,"instruction":"Serve stacked with butter, maple syrup, and fresh berries."}]'::jsonb,
  true, ARRAY['American','breakfast','pancakes']
),

-- 10. Shakshuka
(
  '00000000-0000-0000-0000-000000000060',
  '00000000-0000-0000-0000-0000000becee',
  'Shakshuka',
  'Eggs poached in a spiced tomato-pepper sauce, served straight from the skillet with crusty bread.',
  'Middle Eastern', 'easy', 10, 25, 4,
  'https://image.pollinations.ai/prompt/overhead%20food%20photography%20shakshuka%20eggs%20tomato%20sauce%20cast%20iron%20skillet%20bread?width=800&height=800&seed=2010&nologo=true',
  '{"salt":55,"sweet":30,"umami":50,"spice":55,"acid":50}'::jsonb,
  '[{"amount":"800","unit":"g","name":"canned crushed tomatoes"},{"amount":"1","unit":"","name":"red bell pepper"},{"amount":"1","unit":"","name":"onion"},{"amount":"3","unit":"cloves","name":"garlic"},{"amount":"6","unit":"","name":"eggs"},{"amount":"1","unit":"tsp","name":"cumin"},{"amount":"1","unit":"tsp","name":"paprika"},{"amount":"1/2","unit":"tsp","name":"chili flakes"},{"amount":"2","unit":"tbsp","name":"olive oil"}]'::jsonb,
  '[{"order":1,"instruction":"Heat olive oil in a large skillet. Saute diced onion and bell pepper until softened, about 5 minutes. Add garlic, cumin, paprika, and chili flakes; cook 1 minute."},{"order":2,"instruction":"Pour in crushed tomatoes. Season with salt and pepper. Simmer 10 minutes until slightly thickened."},{"order":3,"instruction":"Make 6 wells in the sauce. Crack an egg into each well. Cover and cook over medium-low for 7-10 minutes until whites are set but yolks are still runny."},{"order":4,"instruction":"Scatter fresh herbs and crumbled feta if desired. Serve with warm crusty bread for dipping."}]'::jsonb,
  true, ARRAY['Middle Eastern','breakfast','eggs','vegetarian']
),

-- 11. Acai Bowl
(
  '00000000-0000-0000-0000-000000000061',
  '00000000-0000-0000-0000-0000000becee',
  'Acai Bowl',
  'A thick, frosty acai blend topped with crunchy granola, fresh fruit, and a drizzle of honey.',
  'Brazilian', 'easy', 10, 0, 2,
  'https://image.pollinations.ai/prompt/overhead%20food%20photography%20acai%20bowl%20purple%20granola%20banana%20slices%20berries%20coconut?width=800&height=800&seed=2011&nologo=true',
  '{"salt":5,"sweet":70,"umami":5,"spice":0,"acid":30}'::jsonb,
  '[{"amount":"2","unit":"packets","name":"frozen acai puree"},{"amount":"1","unit":"","name":"banana"},{"amount":"1/2","unit":"cup","name":"frozen mixed berries"},{"amount":"1/2","unit":"cup","name":"almond milk"},{"amount":"1/2","unit":"cup","name":"granola"},{"amount":"1","unit":"tbsp","name":"honey"}]'::jsonb,
  '[{"order":1,"instruction":"Break frozen acai packets into chunks. Blend with half the banana, frozen berries, and almond milk until thick and smooth -- it should be thicker than a smoothie."},{"order":2,"instruction":"Pour into a bowl. Top with sliced banana, extra berries, granola, and coconut flakes."},{"order":3,"instruction":"Drizzle with honey and serve immediately before it melts."}]'::jsonb,
  true, ARRAY['Brazilian','breakfast','smoothie','vegan','fruit']
),

-- 12. French Toast
(
  '00000000-0000-0000-0000-000000000062',
  '00000000-0000-0000-0000-0000000becee',
  'French Toast',
  'Thick-cut brioche soaked in vanilla custard, pan-fried to a golden caramelized crust.',
  'French', 'easy', 10, 15, 4,
  'https://image.pollinations.ai/prompt/overhead%20food%20photography%20french%20toast%20golden%20brioche%20powdered%20sugar%20maple%20syrup%20berries?width=800&height=800&seed=2012&nologo=true',
  '{"salt":20,"sweet":65,"umami":10,"spice":15,"acid":5}'::jsonb,
  '[{"amount":"4","unit":"slices","name":"brioche bread"},{"amount":"3","unit":"","name":"eggs"},{"amount":"1/2","unit":"cup","name":"whole milk"},{"amount":"1","unit":"tsp","name":"vanilla extract"},{"amount":"1/2","unit":"tsp","name":"cinnamon"},{"amount":"2","unit":"tbsp","name":"unsalted butter"},{"amount":"","unit":"","name":"maple syrup"}]'::jsonb,
  '[{"order":1,"instruction":"Whisk eggs, milk, vanilla, cinnamon, and a pinch of salt in a shallow dish."},{"order":2,"instruction":"Soak brioche slices in the custard for 30 seconds per side -- don''t let them get soggy."},{"order":3,"instruction":"Melt butter in a skillet over medium heat. Cook slices 2-3 minutes per side until deeply golden and caramelized."},{"order":4,"instruction":"Serve with maple syrup, powdered sugar, and fresh berries."}]'::jsonb,
  true, ARRAY['French','breakfast','brunch']
),

-- 13. Eggs Benedict
(
  '00000000-0000-0000-0000-000000000063',
  '00000000-0000-0000-0000-0000000becee',
  'Eggs Benedict',
  'Poached eggs and Canadian bacon on toasted English muffins, blanketed in silky hollandaise.',
  'American', 'hard', 15, 20, 4,
  'https://image.pollinations.ai/prompt/overhead%20food%20photography%20eggs%20benedict%20hollandaise%20sauce%20english%20muffin%20chives?width=800&height=800&seed=2013&nologo=true',
  '{"salt":55,"sweet":10,"umami":45,"spice":5,"acid":30}'::jsonb,
  '[{"amount":"4","unit":"","name":"eggs"},{"amount":"4","unit":"slices","name":"Canadian bacon"},{"amount":"2","unit":"","name":"English muffins"},{"amount":"3","unit":"","name":"egg yolks"},{"amount":"1/2","unit":"cup","name":"unsalted butter"},{"amount":"1","unit":"tbsp","name":"lemon juice"},{"amount":"1","unit":"tbsp","name":"white vinegar"}]'::jsonb,
  '[{"order":1,"instruction":"Make hollandaise: whisk egg yolks and lemon juice over a double boiler. Slowly drizzle in melted butter while whisking constantly until thick and emulsified. Season and keep warm."},{"order":2,"instruction":"Bring a pot of water to a gentle simmer. Add vinegar. Swirl water and slide eggs in one at a time. Poach 3-4 minutes until whites are set."},{"order":3,"instruction":"Toast English muffin halves. Warm Canadian bacon in a skillet."},{"order":4,"instruction":"Stack: muffin half, bacon, poached egg. Spoon hollandaise generously over top. Garnish with chives and cracked pepper."}]'::jsonb,
  true, ARRAY['American','breakfast','brunch','eggs']
),

-- ===== INTERNATIONAL =====

-- 14. Pad Thai
(
  '00000000-0000-0000-0000-000000000064',
  '00000000-0000-0000-0000-0000000becee',
  'Pad Thai',
  'Sweet-tangy stir-fried rice noodles with shrimp, peanuts, and a squeeze of lime.',
  'Thai', 'medium', 20, 10, 4,
  'https://image.pollinations.ai/prompt/overhead%20food%20photography%20pad%20thai%20rice%20noodles%20shrimp%20peanuts%20lime%20wok?width=800&height=800&seed=2014&nologo=true',
  '{"salt":60,"sweet":50,"umami":65,"spice":30,"acid":55}'::jsonb,
  '[{"amount":"200","unit":"g","name":"rice noodles"},{"amount":"300","unit":"g","name":"shrimp"},{"amount":"3","unit":"tbsp","name":"tamarind paste"},{"amount":"2","unit":"tbsp","name":"fish sauce"},{"amount":"2","unit":"tbsp","name":"sugar"},{"amount":"2","unit":"","name":"eggs"},{"amount":"1","unit":"cup","name":"bean sprouts"},{"amount":"1/4","unit":"cup","name":"roasted peanuts"},{"amount":"2","unit":"","name":"limes"},{"amount":"2","unit":"tbsp","name":"vegetable oil"}]'::jsonb,
  '[{"order":1,"instruction":"Soak rice noodles in warm water 20 minutes until pliable. Drain. Mix tamarind paste, fish sauce, and sugar into a sauce."},{"order":2,"instruction":"Heat oil in a wok over high heat. Cook shrimp until pink, push to the side. Scramble eggs in the wok."},{"order":3,"instruction":"Add drained noodles and sauce. Toss vigorously 2-3 minutes until noodles are tender and coated."},{"order":4,"instruction":"Add bean sprouts, toss briefly. Serve topped with crushed peanuts, lime wedges, and chili flakes."}]'::jsonb,
  true, ARRAY['Thai','noodles','seafood']
),

-- 15. Butter Chicken
(
  '00000000-0000-0000-0000-000000000065',
  '00000000-0000-0000-0000-0000000becee',
  'Butter Chicken',
  'Tender tandoori-spiced chicken in a velvety tomato-butter sauce with a touch of cream.',
  'Indian', 'medium', 25, 30, 4,
  'https://image.pollinations.ai/prompt/overhead%20food%20photography%20butter%20chicken%20creamy%20orange%20sauce%20basmati%20rice%20naan?width=800&height=800&seed=2015&nologo=true',
  '{"salt":55,"sweet":40,"umami":60,"spice":55,"acid":30}'::jsonb,
  '[{"amount":"700","unit":"g","name":"chicken thigh"},{"amount":"1","unit":"cup","name":"plain yogurt"},{"amount":"400","unit":"g","name":"canned tomatoes"},{"amount":"3","unit":"tbsp","name":"unsalted butter"},{"amount":"1/2","unit":"cup","name":"heavy cream"},{"amount":"2","unit":"tsp","name":"garam masala"},{"amount":"1","unit":"tsp","name":"turmeric"},{"amount":"1","unit":"","name":"onion"},{"amount":"3","unit":"cloves","name":"garlic"},{"amount":"1","unit":"inch","name":"fresh ginger"}]'::jsonb,
  '[{"order":1,"instruction":"Marinate chicken in yogurt, garam masala, turmeric, salt, and chili powder for at least 1 hour."},{"order":2,"instruction":"Grill or broil chicken until charred. Chop into pieces."},{"order":3,"instruction":"Melt butter in a pan. Saute onion, garlic, and ginger until golden. Add canned tomatoes and simmer 15 minutes. Blend until smooth, return to pan."},{"order":4,"instruction":"Add cream and chicken. Simmer 10 minutes. Finish with a knob of butter. Serve over basmati rice with naan."}]'::jsonb,
  true, ARRAY['Indian','curry','chicken']
),

-- 16. Japanese Gyoza
(
  '00000000-0000-0000-0000-000000000066',
  '00000000-0000-0000-0000-0000000becee',
  'Japanese Gyoza',
  'Crispy-bottomed pork dumplings with a juicy ginger-cabbage filling and tangy dipping sauce.',
  'Japanese', 'medium', 30, 10, 4,
  'https://image.pollinations.ai/prompt/overhead%20food%20photography%20japanese%20gyoza%20dumplings%20crispy%20bottom%20dipping%20sauce%20plate?width=800&height=800&seed=2016&nologo=true',
  '{"salt":55,"sweet":15,"umami":70,"spice":20,"acid":35}'::jsonb,
  '[{"amount":"300","unit":"g","name":"ground pork"},{"amount":"2","unit":"cups","name":"napa cabbage"},{"amount":"2","unit":"","name":"scallions"},{"amount":"1","unit":"tbsp","name":"fresh ginger"},{"amount":"1","unit":"tbsp","name":"soy sauce"},{"amount":"1","unit":"tsp","name":"sesame oil"},{"amount":"30","unit":"","name":"gyoza wrappers"},{"amount":"2","unit":"tbsp","name":"vegetable oil"},{"amount":"","unit":"","name":"rice vinegar"}]'::jsonb,
  '[{"order":1,"instruction":"Finely chop cabbage and sprinkle with salt. Let sit 10 minutes, then squeeze out moisture. Mix with pork, scallions, ginger, soy sauce, and sesame oil."},{"order":2,"instruction":"Place a spoonful of filling in each wrapper. Fold in half and pleat the edge to seal tightly."},{"order":3,"instruction":"Heat oil in a non-stick skillet. Place gyoza flat-side down. Fry 2 minutes until golden. Add 1/4 cup water, cover, and steam 5 minutes until water evaporates and bottoms crisp again."},{"order":4,"instruction":"Serve crispy-side up with a dipping sauce of soy sauce, rice vinegar, and chili oil."}]'::jsonb,
  true, ARRAY['Japanese','dumplings','pork','appetizer']
),

-- 17. Tacos al Pastor
(
  '00000000-0000-0000-0000-000000000067',
  '00000000-0000-0000-0000-0000000becee',
  'Tacos al Pastor',
  'Smoky achiote-marinated pork with charred pineapple, onion, and fresh cilantro on warm corn tortillas.',
  'Mexican', 'medium', 30, 20, 6,
  'https://image.pollinations.ai/prompt/overhead%20food%20photography%20tacos%20al%20pastor%20pineapple%20cilantro%20corn%20tortillas%20lime?width=800&height=800&seed=2017&nologo=true',
  '{"salt":55,"sweet":35,"umami":50,"spice":60,"acid":45}'::jsonb,
  '[{"amount":"700","unit":"g","name":"pork shoulder"},{"amount":"3","unit":"tbsp","name":"achiote paste"},{"amount":"1/2","unit":"","name":"pineapple"},{"amount":"1","unit":"","name":"white onion"},{"amount":"12","unit":"","name":"corn tortillas"},{"amount":"1","unit":"bunch","name":"fresh cilantro"},{"amount":"2","unit":"","name":"limes"},{"amount":"1","unit":"tbsp","name":"vegetable oil"}]'::jsonb,
  '[{"order":1,"instruction":"Blend achiote paste with vinegar, garlic, cumin, and orange juice into a smooth marinade. Coat sliced pork and marinate at least 2 hours."},{"order":2,"instruction":"Grill or pan-fry pork over high heat until charred and cooked through. Chop finely. Grill pineapple slices until caramelized, then dice."},{"order":3,"instruction":"Warm corn tortillas on a dry comal or skillet."},{"order":4,"instruction":"Assemble tacos: pork, pineapple, diced onion, cilantro, and a squeeze of lime."}]'::jsonb,
  true, ARRAY['Mexican','tacos','pork','street food']
),

-- 18. Bibimbap
(
  '00000000-0000-0000-0000-000000000068',
  '00000000-0000-0000-0000-0000000becee',
  'Bibimbap',
  'A colorful Korean rice bowl with sauteed vegetables, gochujang sauce, and a crispy-bottomed fried egg.',
  'Korean', 'medium', 25, 20, 4,
  'https://image.pollinations.ai/prompt/overhead%20food%20photography%20bibimbap%20korean%20rice%20bowl%20colorful%20vegetables%20fried%20egg%20gochujang?width=800&height=800&seed=2018&nologo=true',
  '{"salt":55,"sweet":25,"umami":60,"spice":55,"acid":20}'::jsonb,
  '[{"amount":"2","unit":"cups","name":"short-grain rice"},{"amount":"200","unit":"g","name":"ground beef"},{"amount":"1","unit":"","name":"carrot"},{"amount":"200","unit":"g","name":"spinach"},{"amount":"1","unit":"","name":"zucchini"},{"amount":"4","unit":"","name":"eggs"},{"amount":"3","unit":"tbsp","name":"gochujang"},{"amount":"1","unit":"tbsp","name":"sesame oil"},{"amount":"1","unit":"tbsp","name":"soy sauce"}]'::jsonb,
  '[{"order":1,"instruction":"Cook rice. Saute each vegetable separately with a drop of sesame oil and salt: julienned carrot, blanched spinach, sliced zucchini."},{"order":2,"instruction":"Season ground beef with soy sauce and sesame oil. Cook in a hot skillet until browned."},{"order":3,"instruction":"Fry eggs sunny-side up with crispy edges."},{"order":4,"instruction":"Arrange rice in bowls, top with vegetables and beef in sections. Add fried egg. Serve with gochujang and sesame oil on the side. Mix everything together before eating."}]'::jsonb,
  true, ARRAY['Korean','rice bowl','beef','vegetables']
),

-- 19. Baklava
(
  '00000000-0000-0000-0000-000000000069',
  '00000000-0000-0000-0000-0000000becee',
  'Baklava',
  'Layers of crispy phyllo dough, chopped pistachios and walnuts, drenched in honey-rose syrup.',
  'Middle Eastern', 'hard', 30, 45, 20,
  'https://image.pollinations.ai/prompt/overhead%20food%20photography%20baklava%20diamond%20cut%20pistachios%20honey%20syrup%20golden?width=800&height=800&seed=2019&nologo=true',
  '{"salt":15,"sweet":85,"umami":10,"spice":15,"acid":10}'::jsonb,
  '[{"amount":"1","unit":"lb","name":"phyllo dough"},{"amount":"1","unit":"cup","name":"unsalted butter"},{"amount":"2","unit":"cups","name":"mixed pistachios and walnuts"},{"amount":"1","unit":"cup","name":"sugar"},{"amount":"1","unit":"cup","name":"water"},{"amount":"1/2","unit":"cup","name":"honey"},{"amount":"1","unit":"tbsp","name":"lemon juice"},{"amount":"1","unit":"tsp","name":"rose water"}]'::jsonb,
  '[{"order":1,"instruction":"Chop nuts finely. Mix with a pinch of cinnamon. Melt butter. Brush a 9x13 pan with butter."},{"order":2,"instruction":"Layer 8 sheets of phyllo in the pan, brushing each with butter. Spread a thin layer of nuts. Repeat phyllo and nut layers until nuts are used. Top with 8 more buttered sheets."},{"order":3,"instruction":"Cut into diamond shapes with a sharp knife. Bake at 350F (175C) for 40-45 minutes until deep golden and crispy."},{"order":4,"instruction":"While baking, simmer sugar, water, honey, and lemon juice for 10 minutes. Add rose water. Pour hot syrup over hot baklava. Let soak at least 4 hours before serving."}]'::jsonb,
  true, ARRAY['Middle Eastern','dessert','pastry','nuts']
),

-- 20. Pho Bo (Vietnamese Beef Pho)
(
  '00000000-0000-0000-0000-000000000070',
  '00000000-0000-0000-0000-0000000becee',
  'Pho Bo (Vietnamese Beef Pho)',
  'Fragrant star anise and cinnamon beef broth poured over rice noodles with paper-thin sliced beef.',
  'Vietnamese', 'hard', 20, 120, 4,
  'https://image.pollinations.ai/prompt/overhead%20food%20photography%20pho%20bo%20vietnamese%20beef%20noodle%20soup%20herbs%20lime%20bean%20sprouts?width=800&height=800&seed=2020&nologo=true',
  '{"salt":65,"sweet":15,"umami":80,"spice":30,"acid":35}'::jsonb,
  '[{"amount":"1","unit":"kg","name":"beef bones"},{"amount":"300","unit":"g","name":"beef sirloin"},{"amount":"400","unit":"g","name":"rice noodles"},{"amount":"3","unit":"","name":"star anise"},{"amount":"1","unit":"","name":"cinnamon stick"},{"amount":"2","unit":"tbsp","name":"fish sauce"},{"amount":"1","unit":"","name":"onion"},{"amount":"3","unit":"inch","name":"fresh ginger"},{"amount":"","unit":"","name":"bean sprouts"},{"amount":"","unit":"","name":"fresh Thai basil"}]'::jsonb,
  '[{"order":1,"instruction":"Char onion and ginger under a broiler until blackened. Blanch beef bones in boiling water 5 minutes, drain, and rinse."},{"order":2,"instruction":"In a large pot, cover bones with 3 liters of water. Add charred onion, ginger, star anise, cinnamon, and a pinch of sugar. Simmer 2 hours, skimming foam regularly."},{"order":3,"instruction":"Strain broth. Season with fish sauce and salt. Cook rice noodles according to package. Slice sirloin paper-thin."},{"order":4,"instruction":"Place noodles in bowls, top with raw beef slices. Ladle boiling broth over to cook the beef. Serve with bean sprouts, Thai basil, lime wedges, and hoisin sauce."}]'::jsonb,
  true, ARRAY['Vietnamese','soup','beef','noodles']
),

-- 21. Falafel
(
  '00000000-0000-0000-0000-000000000071',
  '00000000-0000-0000-0000-0000000becee',
  'Falafel',
  'Crispy, herb-packed chickpea fritters with a fluffy interior -- perfect in pita with tahini.',
  'Middle Eastern', 'medium', 20, 15, 4,
  'https://image.pollinations.ai/prompt/overhead%20food%20photography%20falafel%20crispy%20golden%20pita%20bread%20tahini%20sauce%20herbs?width=800&height=800&seed=2021&nologo=true',
  '{"salt":50,"sweet":10,"umami":35,"spice":40,"acid":25}'::jsonb,
  '[{"amount":"400","unit":"g","name":"dried chickpeas"},{"amount":"1","unit":"","name":"onion"},{"amount":"4","unit":"cloves","name":"garlic"},{"amount":"1","unit":"cup","name":"fresh parsley"},{"amount":"1","unit":"cup","name":"fresh cilantro"},{"amount":"1","unit":"tsp","name":"cumin"},{"amount":"1","unit":"tsp","name":"baking powder"},{"amount":"","unit":"","name":"vegetable oil for frying"}]'::jsonb,
  '[{"order":1,"instruction":"Soak dried chickpeas in water overnight (at least 12 hours). Do NOT use canned -- they are too soft. Drain well."},{"order":2,"instruction":"Pulse chickpeas, onion, garlic, parsley, cilantro, cumin, and salt in a food processor until a coarse, moldable paste forms. Refrigerate 1 hour."},{"order":3,"instruction":"Mix in baking powder. Form into walnut-sized balls. Fry in 350F (175C) oil for 3-4 minutes until deep golden brown and crispy."},{"order":4,"instruction":"Drain on paper towels. Serve in warm pita with tahini, pickled turnip, and fresh vegetables."}]'::jsonb,
  true, ARRAY['Middle Eastern','vegetarian','chickpea','street food']
),

-- ===== SNACKS & APPETIZERS =====

-- 22. Classic Hummus
(
  '00000000-0000-0000-0000-000000000072',
  '00000000-0000-0000-0000-0000000becee',
  'Classic Hummus',
  'Ultra-smooth chickpea and tahini dip swirled with olive oil and a hint of garlic.',
  'Middle Eastern', 'easy', 10, 0, 6,
  'https://image.pollinations.ai/prompt/overhead%20food%20photography%20hummus%20smooth%20swirl%20olive%20oil%20paprika%20pita%20chips?width=800&height=800&seed=2022&nologo=true',
  '{"salt":45,"sweet":5,"umami":30,"spice":15,"acid":40}'::jsonb,
  '[{"amount":"400","unit":"g","name":"canned chickpeas"},{"amount":"1/4","unit":"cup","name":"tahini"},{"amount":"3","unit":"tbsp","name":"lemon juice"},{"amount":"2","unit":"cloves","name":"garlic"},{"amount":"2","unit":"tbsp","name":"olive oil"},{"amount":"1/2","unit":"tsp","name":"cumin"},{"amount":"2","unit":"tbsp","name":"ice water"}]'::jsonb,
  '[{"order":1,"instruction":"Process tahini and lemon juice in a food processor for 1 minute until light and whipped."},{"order":2,"instruction":"Add drained chickpeas, garlic, cumin, and salt. Process 2 minutes, scraping sides. With motor running, drizzle in ice water until very smooth."},{"order":3,"instruction":"Spread onto a plate with the back of a spoon to create swirls. Drizzle with olive oil, sprinkle with paprika and whole chickpeas. Serve with warm pita."}]'::jsonb,
  true, ARRAY['Middle Eastern','appetizer','dip','vegetarian','vegan']
),

-- 23. Bruschetta
(
  '00000000-0000-0000-0000-000000000073',
  '00000000-0000-0000-0000-0000000becee',
  'Bruschetta',
  'Garlic-rubbed grilled bread piled high with ripe tomatoes, fresh basil, and aged balsamic.',
  'Italian', 'easy', 15, 5, 6,
  'https://image.pollinations.ai/prompt/overhead%20food%20photography%20bruschetta%20tomato%20basil%20grilled%20bread%20balsamic%20drizzle?width=800&height=800&seed=2023&nologo=true',
  '{"salt":40,"sweet":25,"umami":35,"spice":5,"acid":50}'::jsonb,
  '[{"amount":"4","unit":"","name":"ripe tomatoes"},{"amount":"1","unit":"","name":"baguette"},{"amount":"2","unit":"cloves","name":"garlic"},{"amount":"1/4","unit":"cup","name":"fresh basil"},{"amount":"3","unit":"tbsp","name":"extra virgin olive oil"},{"amount":"1","unit":"tbsp","name":"balsamic vinegar"}]'::jsonb,
  '[{"order":1,"instruction":"Dice tomatoes and toss with torn basil, olive oil, balsamic vinegar, and a pinch of salt. Let marinate 15 minutes."},{"order":2,"instruction":"Slice baguette on a diagonal, 3/4-inch thick. Brush with olive oil and grill or broil until golden and crispy."},{"order":3,"instruction":"Rub each warm toast with a cut garlic clove. Spoon tomato mixture generously on top. Drizzle with extra olive oil and serve immediately."}]'::jsonb,
  true, ARRAY['Italian','appetizer','tomato','vegetarian']
),

-- 24. Guacamole
(
  '00000000-0000-0000-0000-000000000074',
  '00000000-0000-0000-0000-0000000becee',
  'Guacamole',
  'Chunky, bright guacamole with fresh lime, jalapeno, and cilantro -- best eaten within the hour.',
  'Mexican', 'easy', 10, 0, 4,
  'https://image.pollinations.ai/prompt/overhead%20food%20photography%20guacamole%20chunky%20avocado%20lime%20tortilla%20chips%20stone%20molcajete?width=800&height=800&seed=2024&nologo=true',
  '{"salt":40,"sweet":10,"umami":20,"spice":35,"acid":55}'::jsonb,
  '[{"amount":"3","unit":"","name":"ripe avocados"},{"amount":"1","unit":"","name":"lime"},{"amount":"1/2","unit":"","name":"red onion"},{"amount":"1","unit":"","name":"jalapeno"},{"amount":"1/4","unit":"cup","name":"fresh cilantro"},{"amount":"1","unit":"","name":"roma tomato"}]'::jsonb,
  '[{"order":1,"instruction":"Halve avocados, remove pits, and scoop into a bowl. Mash with a fork to desired chunkiness."},{"order":2,"instruction":"Finely dice onion, jalapeno (seeded for less heat), tomato, and cilantro. Fold into avocado."},{"order":3,"instruction":"Squeeze in lime juice, season with salt. Taste and adjust. Serve immediately with tortilla chips."}]'::jsonb,
  true, ARRAY['Mexican','appetizer','dip','vegan','avocado']
),

-- 25. Spinach Artichoke Dip
(
  '00000000-0000-0000-0000-000000000075',
  '00000000-0000-0000-0000-0000000becee',
  'Spinach Artichoke Dip',
  'A hot, bubbling blend of creamy cheese, tender spinach, and marinated artichoke hearts.',
  'American', 'easy', 10, 25, 8,
  'https://image.pollinations.ai/prompt/overhead%20food%20photography%20spinach%20artichoke%20dip%20bubbling%20cheese%20cast%20iron%20skillet%20bread?width=800&height=800&seed=2025&nologo=true',
  '{"salt":50,"sweet":10,"umami":45,"spice":10,"acid":15}'::jsonb,
  '[{"amount":"300","unit":"g","name":"frozen spinach"},{"amount":"400","unit":"g","name":"canned artichoke hearts"},{"amount":"225","unit":"g","name":"cream cheese"},{"amount":"1/2","unit":"cup","name":"sour cream"},{"amount":"1","unit":"cup","name":"shredded mozzarella"},{"amount":"1/2","unit":"cup","name":"grated parmesan"},{"amount":"3","unit":"cloves","name":"garlic"}]'::jsonb,
  '[{"order":1,"instruction":"Thaw and squeeze all moisture from spinach. Drain and roughly chop artichoke hearts."},{"order":2,"instruction":"Mix softened cream cheese, sour cream, half the mozzarella, parmesan, and minced garlic until smooth. Fold in spinach and artichokes."},{"order":3,"instruction":"Spread into a baking dish. Top with remaining mozzarella. Bake at 375F (190C) for 25 minutes until golden and bubbling."},{"order":4,"instruction":"Serve hot with toasted baguette slices, tortilla chips, or vegetable sticks."}]'::jsonb,
  true, ARRAY['American','appetizer','dip','cheese','vegetarian']
),

-- ===== DRINKS =====

-- 26. Classic Margarita
(
  '00000000-0000-0000-0000-000000000076',
  '00000000-0000-0000-0000-0000000becee',
  'Classic Margarita',
  'A perfectly balanced cocktail: tequila, fresh lime juice, and orange liqueur with a salted rim.',
  'Mexican', 'easy', 5, 0, 1,
  'https://image.pollinations.ai/prompt/overhead%20food%20photography%20classic%20margarita%20cocktail%20salted%20rim%20lime%20wedge%20ice?width=800&height=800&seed=2026&nologo=true',
  '{"salt":35,"sweet":30,"umami":0,"spice":0,"acid":75}'::jsonb,
  '[{"amount":"2","unit":"oz","name":"tequila blanco"},{"amount":"1","unit":"oz","name":"fresh lime juice"},{"amount":"1","unit":"oz","name":"orange liqueur"},{"amount":"1/2","unit":"oz","name":"agave syrup"},{"amount":"","unit":"","name":"ice"},{"amount":"","unit":"","name":"coarse salt for rim"}]'::jsonb,
  '[{"order":1,"instruction":"Run a lime wedge around the rim of a rocks glass. Dip rim in coarse salt."},{"order":2,"instruction":"Combine tequila, lime juice, orange liqueur, and agave syrup in a cocktail shaker filled with ice."},{"order":3,"instruction":"Shake vigorously 15 seconds until very cold. Strain over fresh ice into the prepared glass. Garnish with a lime wheel."}]'::jsonb,
  true, ARRAY['Mexican','drink','cocktail','citrus']
),

-- 27. Mango Lassi
(
  '00000000-0000-0000-0000-000000000077',
  '00000000-0000-0000-0000-0000000becee',
  'Mango Lassi',
  'A creamy, chilled Indian yogurt smoothie with sweet mango and a hint of cardamom.',
  'Indian', 'easy', 5, 0, 2,
  'https://image.pollinations.ai/prompt/overhead%20food%20photography%20mango%20lassi%20yogurt%20drink%20tall%20glass%20cardamom%20saffron?width=800&height=800&seed=2027&nologo=true',
  '{"salt":5,"sweet":65,"umami":5,"spice":10,"acid":20}'::jsonb,
  '[{"amount":"1","unit":"cup","name":"ripe mango chunks"},{"amount":"1","unit":"cup","name":"plain yogurt"},{"amount":"1/2","unit":"cup","name":"cold milk"},{"amount":"2","unit":"tbsp","name":"sugar"},{"amount":"1/4","unit":"tsp","name":"ground cardamom"},{"amount":"","unit":"","name":"ice cubes"}]'::jsonb,
  '[{"order":1,"instruction":"Blend mango, yogurt, milk, sugar, and cardamom until completely smooth."},{"order":2,"instruction":"Add a handful of ice and blend again until frothy and cold."},{"order":3,"instruction":"Pour into tall glasses. Garnish with a pinch of cardamom or a saffron strand. Serve immediately."}]'::jsonb,
  true, ARRAY['Indian','drink','smoothie','mango','yogurt']
),

-- 28. Matcha Latte
(
  '00000000-0000-0000-0000-000000000078',
  '00000000-0000-0000-0000-0000000becee',
  'Matcha Latte',
  'Earthy ceremonial-grade matcha whisked into frothy steamed milk -- calm energy in a cup.',
  'Japanese', 'easy', 5, 0, 1,
  'https://image.pollinations.ai/prompt/overhead%20food%20photography%20matcha%20latte%20green%20frothy%20ceramic%20cup%20latte%20art?width=800&height=800&seed=2028&nologo=true',
  '{"salt":5,"sweet":30,"umami":40,"spice":0,"acid":5}'::jsonb,
  '[{"amount":"2","unit":"tsp","name":"ceremonial matcha powder"},{"amount":"2","unit":"tbsp","name":"hot water"},{"amount":"1","unit":"cup","name":"milk of choice"},{"amount":"1","unit":"tsp","name":"honey or sugar"}]'::jsonb,
  '[{"order":1,"instruction":"Sift matcha powder into a bowl or cup to remove clumps."},{"order":2,"instruction":"Add 2 tablespoons of hot water (not boiling -- around 175F / 80C). Whisk vigorously with a bamboo chasen or small whisk until smooth and frothy."},{"order":3,"instruction":"Heat and froth milk. Pour into a cup, then pour matcha over the milk. Sweeten to taste and stir gently. Serve hot or over ice."}]'::jsonb,
  true, ARRAY['Japanese','drink','tea','matcha']
)

on conflict (id) do nothing;
