-- Apply via Supabase dashboard SQL editor (service_role context).
-- Creates the official @becipe profile and seeds ~50 canonical recipes
-- authored by it, each with pollinations.ai cover photos and palate vectors.
-- Run once. Idempotent: uses ON CONFLICT DO NOTHING throughout.

-- 1. Official @becipe profile
insert into profiles (id, username, display_name, palate_vector, created_at)
values (
  '00000000-0000-0000-0000-0000000becee',
  'becipe',
  'becipe',
  '{"salt":55,"sweet":50,"umami":60,"spice":45,"acid":50}'::jsonb,
  now()
)
on conflict (id) do nothing;

-- 2. Canonical recipes
insert into recipes (
  id, created_by, title, description, cuisine, difficulty,
  prep_time_min, cook_time_min, servings,
  cover_image_url, palate_vector, ingredients, steps, is_public, tags
) values

-- 1. Miso Salmon
(
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-0000000becee',
  'Miso Glazed Salmon',
  'Sweet-savory miso glaze on pan-seared salmon, finished with sesame and scallion.',
  'Japanese', 'easy', 10, 12, 2,
  'https://image.pollinations.ai/prompt/overhead%20food%20photography%20miso%20glazed%20salmon%20sesame%20scallion%20dark%20plate?width=800&height=800&seed=1001&nologo=true',
  '{"salt":65,"sweet":55,"umami":80,"spice":20,"acid":30}'::jsonb,
  '[{"amount":"2","unit":"fillets","name":"salmon"},{"amount":"2","unit":"tbsp","name":"white miso"},{"amount":"1","unit":"tbsp","name":"mirin"},{"amount":"1","unit":"tbsp","name":"soy sauce"},{"amount":"1","unit":"tsp","name":"honey"},{"amount":"1","unit":"tbsp","name":"sesame oil"},{"amount":"2","unit":"","name":"scallion"},{"amount":"1","unit":"tsp","name":"sesame seed"}]'::jsonb,
  '[{"order":1,"instruction":"Whisk miso, mirin, soy sauce, and honey into a smooth glaze."},{"order":2,"instruction":"Pat salmon dry and brush glaze over flesh side. Marinate 15 minutes."},{"order":3,"instruction":"Heat sesame oil in a non-stick skillet over medium-high. Sear salmon skin-side down 4 minutes, flip, brush with remaining glaze, cook 3 minutes more."},{"order":4,"instruction":"Slice scallion, scatter over salmon with sesame seeds. Serve immediately."}]'::jsonb,
  true, ARRAY['Japanese']
),
-- 2. Cacio e Pepe
(
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-0000000becee',
  'Cacio e Pepe',
  'Roman pasta perfection: tonnarelli, Pecorino Romano, and aggressively cracked black pepper.',
  'Italian', 'medium', 5, 20, 2,
  'https://image.pollinations.ai/prompt/overhead%20food%20photography%20cacio%20e%20pepe%20pasta%20black%20pepper%20white%20bowl?width=800&height=800&seed=1002&nologo=true',
  '{"salt":70,"sweet":10,"umami":75,"spice":60,"acid":10}'::jsonb,
  '[{"amount":"200","unit":"g","name":"spaghetti"},{"amount":"80","unit":"g","name":"pecorino romano"},{"amount":"20","unit":"g","name":"parmesan"},{"amount":"2","unit":"tsp","name":"black pepper"},{"amount":"","unit":"","name":"kosher salt"}]'::jsonb,
  '[{"order":1,"instruction":"Toast cracked black pepper in a dry skillet 1 minute until fragrant."},{"order":2,"instruction":"Cook pasta in heavily salted water 2 minutes short of al dente. Reserve 1 cup pasta water."},{"order":3,"instruction":"Off heat, add pepper to skillet. Add 1/2 cup pasta water, then drained pasta. Toss vigorously."},{"order":4,"instruction":"Gradually add grated cheeses while tossing, adding pasta water a splash at a time until sauce coats every strand."}]'::jsonb,
  true, ARRAY['Italian']
),

-- 3. Chicken Tikka Masala
(
  '00000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-0000000becee',
  'Chicken Tikka Masala',
  'Charred yogurt-marinated chicken in a smoky tomato-cream sauce with warming spices.',
  'Indian', 'medium', 30, 35, 4,
  'https://image.pollinations.ai/prompt/overhead%20food%20photography%20chicken%20tikka%20masala%20orange%20sauce%20rice%20naan%20cast%20iron?width=800&height=800&seed=1003&nologo=true',
  '{"salt":60,"sweet":35,"umami":65,"spice":75,"acid":35}'::jsonb,
  '[{"amount":"700","unit":"g","name":"chicken thigh"},{"amount":"200","unit":"g","name":"plain yogurt"},{"amount":"2","unit":"tsp","name":"garam masala"},{"amount":"1","unit":"tsp","name":"turmeric"},{"amount":"400","unit":"g","name":"canned crushed tomato"},{"amount":"200","unit":"ml","name":"heavy cream"},{"amount":"1","unit":"","name":"onion"},{"amount":"2","unit":"tbsp","name":"vegetable oil"}]'::jsonb,
  '[{"order":1,"instruction":"Mix yogurt, spices, ginger, and garlic. Marinate chicken 2 hours or overnight."},{"order":2,"instruction":"Grill or broil chicken on high heat until charred in spots. Chop into pieces."},{"order":3,"instruction":"Fry onion in oil until golden brown. Add remaining spices, cook 1 minute. Add crushed tomatoes, simmer 15 minutes."},{"order":4,"instruction":"Add cream and chicken, simmer 10 minutes. Adjust seasoning. Serve with rice and naan."}]'::jsonb,
  true, ARRAY['Indian']
),
-- 4. French Onion Soup
(
  '00000000-0000-0000-0000-000000000004',
  '00000000-0000-0000-0000-0000000becee',
  'French Onion Soup',
  'Deeply caramelized onions in rich beef broth, crowned with a Gruyere-soaked crouton.',
  'French', 'medium', 15, 75, 4,
  'https://image.pollinations.ai/prompt/overhead%20food%20photography%20french%20onion%20soup%20gruyere%20crust%20white%20crock%20steam?width=800&height=800&seed=1004&nologo=true',
  '{"salt":70,"sweet":50,"umami":85,"spice":10,"acid":20}'::jsonb,
  '[{"amount":"1.5","unit":"kg","name":"yellow onion"},{"amount":"4","unit":"tbsp","name":"unsalted butter"},{"amount":"200","unit":"ml","name":"dry white wine"},{"amount":"1","unit":"L","name":"beef stock"},{"amount":"4","unit":"slices","name":"baguette"},{"amount":"200","unit":"g","name":"gruyere cheese"}]'::jsonb,
  '[{"order":1,"instruction":"Slice onions 5mm thick. Cook in butter over medium-low heat 60 minutes, stirring occasionally, until deeply golden."},{"order":2,"instruction":"Sprinkle flour over onions, stir 2 minutes. Add wine, scraping up any fond. Reduce by half."},{"order":3,"instruction":"Add beef stock, thyme, and bay leaf. Simmer 20 minutes. Season generously."},{"order":4,"instruction":"Ladle into oven-safe crocks. Top with baguette slices, pile Gruyere on top. Broil until molten and bubbling."}]'::jsonb,
  true, ARRAY['French']
),

-- 5. Tacos al Pastor
(
  '00000000-0000-0000-0000-000000000005',
  '00000000-0000-0000-0000-0000000becee',
  'Tacos al Pastor',
  'Achiote-chile marinated pork, crisped on a hot pan, with pineapple and cilantro.',
  'Mexican', 'medium', 20, 30, 4,
  'https://image.pollinations.ai/prompt/overhead%20food%20photography%20tacos%20al%20pastor%20pineapple%20cilantro%20corn%20tortilla?width=800&height=800&seed=1005&nologo=true',
  '{"salt":60,"sweet":50,"umami":55,"spice":65,"acid":55}'::jsonb,
  '[{"amount":"600","unit":"g","name":"pork shoulder"},{"amount":"3","unit":"","name":"dried guajillo chili"},{"amount":"2","unit":"tbsp","name":"achiote paste"},{"amount":"200","unit":"g","name":"pineapple"},{"amount":"8","unit":"","name":"corn tortilla"},{"amount":"","unit":"","name":"cilantro"}]'::jsonb,
  '[{"order":1,"instruction":"Toast and soak dried chilies 15 minutes. Blend with achiote, vinegar, cumin, and garlic into a smooth paste."},{"order":2,"instruction":"Slice pork thin, toss with marinade. Marinate 2 hours."},{"order":3,"instruction":"Sear pork in batches on a very hot cast iron skillet until charred at the edges. Chop."},{"order":4,"instruction":"Char pineapple slices in the same skillet. Chop roughly. Fill warm tortillas with pork, pineapple, diced onion, cilantro, and lime."}]'::jsonb,
  true, ARRAY['Mexican']
),

-- 6. Shakshuka
(
  '00000000-0000-0000-0000-000000000006',
  '00000000-0000-0000-0000-0000000becee',
  'Shakshuka',
  'Eggs poached in a spiced tomato-pepper sauce, finished with feta and fresh herbs.',
  'Middle Eastern', 'easy', 10, 25, 3,
  'https://image.pollinations.ai/prompt/overhead%20food%20photography%20shakshuka%20eggs%20tomato%20sauce%20feta%20herb%20cast%20iron?width=800&height=800&seed=1006&nologo=true',
  '{"salt":60,"sweet":35,"umami":65,"spice":70,"acid":55}'::jsonb,
  '[{"amount":"1","unit":"","name":"onion"},{"amount":"2","unit":"","name":"red bell pepper"},{"amount":"400","unit":"g","name":"canned crushed tomato"},{"amount":"2","unit":"tsp","name":"cumin"},{"amount":"6","unit":"","name":"egg"},{"amount":"80","unit":"g","name":"feta cheese"},{"amount":"","unit":"","name":"flat-leaf parsley"}]'::jsonb,
  '[{"order":1,"instruction":"Soften onion and pepper in olive oil 8 minutes. Add garlic and spices, cook 1 minute."},{"order":2,"instruction":"Pour in tomatoes. Simmer 10 minutes, season generously."},{"order":3,"instruction":"Make wells in the sauce. Crack eggs into wells, cover, and cook 6-8 minutes until whites are set but yolks still runny."},{"order":4,"instruction":"Crumble feta over top. Scatter parsley. Serve with crusty bread."}]'::jsonb,
  true, ARRAY['Middle Eastern']
),
-- 7. Pad Thai
(
  '00000000-0000-0000-0000-000000000007',
  '00000000-0000-0000-0000-0000000becee',
  'Pad Thai',
  'Wok-tossed rice noodles with shrimp, egg, tamarind sauce, and crunchy peanuts.',
  'Thai', 'medium', 20, 15, 2,
  'https://image.pollinations.ai/prompt/overhead%20food%20photography%20pad%20thai%20shrimp%20peanuts%20lime%20wok%20noodles?width=800&height=800&seed=1007&nologo=true',
  '{"salt":65,"sweet":55,"umami":70,"spice":40,"acid":60}'::jsonb,
  '[{"amount":"200","unit":"g","name":"rice noodle"},{"amount":"200","unit":"g","name":"shrimp"},{"amount":"3","unit":"tbsp","name":"fish sauce"},{"amount":"2","unit":"tbsp","name":"tamarind paste"},{"amount":"3","unit":"","name":"egg"},{"amount":"80","unit":"g","name":"bean sprout"},{"amount":"50","unit":"g","name":"peanut"}]'::jsonb,
  '[{"order":1,"instruction":"Soak noodles in cold water 30 minutes. Mix fish sauce, tamarind paste, and sugar into a sauce."},{"order":2,"instruction":"Stir-fry shrimp in hot oil 2 minutes. Push to the side, scramble eggs."},{"order":3,"instruction":"Add garlic and drained noodles. Toss 2 minutes over high heat. Pour sauce over and toss."},{"order":4,"instruction":"Add bean sprouts and scallion, toss 30 seconds. Plate with crushed peanuts and lime wedges."}]'::jsonb,
  true, ARRAY['Thai']
),

-- 8. Beef Pho
(
  '00000000-0000-0000-0000-000000000008',
  '00000000-0000-0000-0000-0000000becee',
  'Beef Pho',
  'Slow-simmered spiced beef bone broth ladled over silky rice noodles and paper-thin beef.',
  'Vietnamese', 'hard', 30, 180, 4,
  'https://image.pollinations.ai/prompt/overhead%20food%20photography%20beef%20pho%20noodles%20herbs%20bean%20sprouts%20steam?width=800&height=800&seed=1008&nologo=true',
  '{"salt":65,"sweet":30,"umami":90,"spice":35,"acid":30}'::jsonb,
  '[{"amount":"1.5","unit":"kg","name":"beef bones"},{"amount":"400","unit":"g","name":"beef brisket"},{"amount":"200","unit":"g","name":"sirloin steak"},{"amount":"200","unit":"g","name":"rice noodle"},{"amount":"3","unit":"","name":"star anise"},{"amount":"2","unit":"tbsp","name":"fish sauce"}]'::jsonb,
  '[{"order":1,"instruction":"Char onion and ginger directly over flame until blackened."},{"order":2,"instruction":"Blanch beef bones 3 minutes, drain, rinse. Refill pot with fresh water, add bones, brisket, charred aromatics, and whole spices. Simmer 3 hours, skimming."},{"order":3,"instruction":"Remove brisket, slice thinly. Strain broth, season with fish sauce and salt."},{"order":4,"instruction":"Cook noodles per package. Divide into bowls, top with brisket and paper-thin raw sirloin. Ladle boiling broth over to cook the raw beef."},{"order":5,"instruction":"Serve with bean sprouts, basil, and lime on the side."}]'::jsonb,
  true, ARRAY['Vietnamese']
),

-- 9. Greek Salad
(
  '00000000-0000-0000-0000-000000000009',
  '00000000-0000-0000-0000-0000000becee',
  'Classic Greek Salad',
  'Ripe tomatoes, cucumber, kalamata olives, and a whole slab of feta in bright olive oil.',
  'Mediterranean', 'easy', 15, 0, 4,
  'https://image.pollinations.ai/prompt/overhead%20food%20photography%20greek%20salad%20feta%20olives%20tomato%20cucumber%20white%20bowl?width=800&height=800&seed=1009&nologo=true',
  '{"salt":65,"sweet":35,"umami":45,"spice":15,"acid":65}'::jsonb,
  '[{"amount":"4","unit":"","name":"tomato"},{"amount":"1","unit":"","name":"english cucumber"},{"amount":"150","unit":"g","name":"kalamata olive"},{"amount":"200","unit":"g","name":"feta cheese"},{"amount":"4","unit":"tbsp","name":"extra virgin olive oil"},{"amount":"1","unit":"tbsp","name":"red wine vinegar"},{"amount":"1","unit":"tsp","name":"dried oregano"}]'::jsonb,
  '[{"order":1,"instruction":"Cut tomatoes into wedges. Slice cucumber into thick half-moons. Thinly slice red onion and pepper."},{"order":2,"instruction":"Arrange vegetables in a wide bowl. Scatter olives. Place feta slab on top — do not crumble."},{"order":3,"instruction":"Drizzle generously with olive oil and red wine vinegar. Sprinkle dried oregano, salt, and cracked pepper. Serve immediately."}]'::jsonb,
  true, ARRAY['Mediterranean']
),

-- 10. Kung Pao Chicken
(
  '00000000-0000-0000-0000-000000000010',
  '00000000-0000-0000-0000-0000000becee',
  'Kung Pao Chicken',
  'Wok-fried chicken with dried chilies, Sichuan peppercorn tingle, and roasted peanuts.',
  'Chinese', 'medium', 20, 15, 3,
  'https://image.pollinations.ai/prompt/overhead%20food%20photography%20kung%20pao%20chicken%20peanuts%20chili%20scallion%20wok?width=800&height=800&seed=1010&nologo=true',
  '{"salt":70,"sweet":40,"umami":75,"spice":80,"acid":40}'::jsonb,
  '[{"amount":"500","unit":"g","name":"chicken breast"},{"amount":"8","unit":"","name":"dried chili"},{"amount":"1","unit":"tsp","name":"sichuan peppercorn"},{"amount":"2","unit":"tbsp","name":"soy sauce"},{"amount":"1","unit":"tbsp","name":"rice vinegar"},{"amount":"80","unit":"g","name":"peanut"},{"amount":"3","unit":"","name":"scallion"}]'::jsonb,
  '[{"order":1,"instruction":"Cube chicken, toss with half soy sauce and cornstarch, marinate 10 minutes."},{"order":2,"instruction":"Mix remaining soy, rice vinegar, and sugar into a sauce."},{"order":3,"instruction":"Fry Sichuan peppercorns and dried chilies in oil 30 seconds. Add chicken, stir-fry until cooked through."},{"order":4,"instruction":"Add garlic, ginger, pour in sauce, toss 1 minute. Finish with peanuts and scallion."}]'::jsonb,
  true, ARRAY['Chinese']
),
-- 11. Banana Pancakes
(
  '00000000-0000-0000-0000-000000000011',
  '00000000-0000-0000-0000-0000000becee',
  'Fluffy Banana Pancakes',
  'Ripe banana folded into a light buttermilk batter for golden, fragrant weekend pancakes.',
  'American', 'easy', 10, 15, 4,
  'https://image.pollinations.ai/prompt/overhead%20food%20photography%20fluffy%20banana%20pancakes%20maple%20syrup%20stack%20butter?width=800&height=800&seed=1011&nologo=true',
  '{"salt":30,"sweet":70,"umami":10,"spice":15,"acid":25}'::jsonb,
  '[{"amount":"2","unit":"","name":"ripe banana"},{"amount":"200","unit":"g","name":"all-purpose flour"},{"amount":"1","unit":"tsp","name":"baking powder"},{"amount":"250","unit":"ml","name":"buttermilk"},{"amount":"2","unit":"","name":"egg"},{"amount":"2","unit":"tbsp","name":"unsalted butter"}]'::jsonb,
  '[{"order":1,"instruction":"Mash bananas until smooth. Mix with buttermilk, eggs, melted butter, and vanilla."},{"order":2,"instruction":"In another bowl whisk flour, baking powder, baking soda, and sugar. Fold wet into dry until just combined."},{"order":3,"instruction":"Heat a non-stick pan over medium, lightly butter. Pour 1/4 cup batter per pancake. Cook until bubbles form and edges set. Flip, cook 2 minutes more."},{"order":4,"instruction":"Stack and serve with maple syrup."}]'::jsonb,
  true, ARRAY['American']
),

-- 12. Hummus
(
  '00000000-0000-0000-0000-000000000012',
  '00000000-0000-0000-0000-0000000becee',
  'Silky Hummus',
  'Ultra-smooth chickpea and tahini dip, the secret being ice water and patience.',
  'Middle Eastern', 'easy', 10, 0, 6,
  'https://image.pollinations.ai/prompt/overhead%20food%20photography%20silky%20hummus%20olive%20oil%20paprika%20pita%20white%20plate?width=800&height=800&seed=1012&nologo=true',
  '{"salt":55,"sweet":15,"umami":45,"spice":20,"acid":40}'::jsonb,
  '[{"amount":"400","unit":"g","name":"chickpea"},{"amount":"3","unit":"tbsp","name":"tahini"},{"amount":"2","unit":"cloves","name":"garlic"},{"amount":"3","unit":"tbsp","name":"lemon juice"},{"amount":"4","unit":"tbsp","name":"ice water"},{"amount":"0.5","unit":"tsp","name":"cumin"}]'::jsonb,
  '[{"order":1,"instruction":"Drain chickpeas. For maximum smoothness, peel the skins or boil canned chickpeas 20 minutes then drain."},{"order":2,"instruction":"Blend tahini, garlic, lemon juice, and salt until smooth, 1 minute."},{"order":3,"instruction":"Add chickpeas. Blend 3 minutes, slowly adding ice water, until hummus is pale and ultra-smooth."},{"order":4,"instruction":"Swirl onto a plate, drizzle with good olive oil, sprinkle paprika. Serve with warm pita."}]'::jsonb,
  true, ARRAY['Middle Eastern']
),

-- 13. Weeknight Ramen
(
  '00000000-0000-0000-0000-000000000013',
  '00000000-0000-0000-0000-0000000becee',
  'Weeknight Tonkotsu Ramen',
  'Rich pork-based broth shortcut using a pressure cooker, with soft-boiled eggs and chashu.',
  'Japanese', 'hard', 45, 120, 4,
  'https://image.pollinations.ai/prompt/overhead%20food%20photography%20tonkotsu%20ramen%20soft%20boiled%20egg%20chashu%20noodles%20steam?width=800&height=800&seed=1013&nologo=true',
  '{"salt":75,"sweet":25,"umami":95,"spice":30,"acid":20}'::jsonb,
  '[{"amount":"1","unit":"kg","name":"pork bones"},{"amount":"300","unit":"g","name":"pork belly"},{"amount":"200","unit":"g","name":"ramen noodle"},{"amount":"4","unit":"","name":"egg"},{"amount":"3","unit":"tbsp","name":"soy sauce"},{"amount":"2","unit":"tbsp","name":"white miso"},{"amount":"2","unit":"sheets","name":"nori"}]'::jsonb,
  '[{"order":1,"instruction":"Blanch pork bones, drain, rinse. Pressure cook bones with water, garlic, and ginger 2 hours. Strain into a rich milky broth."},{"order":2,"instruction":"Roll pork belly tight, tie with kitchen twine. Braise in soy sauce, mirin, and 200ml water for 1.5 hours until tender. Rest, slice."},{"order":3,"instruction":"Soft-boil eggs 6.5 minutes, shock in ice water. Peel and marinate 1 hour in braising liquid."},{"order":4,"instruction":"Whisk miso into hot broth. Season. Cook noodles per package. Divide into bowls, ladle hot broth over. Top with sliced chashu, halved egg, nori, and scallion."}]'::jsonb,
  true, ARRAY['Japanese']
),

-- 14. Margherita Pizza
(
  '00000000-0000-0000-0000-000000000014',
  '00000000-0000-0000-0000-0000000becee',
  'Margherita Pizza',
  'Neapolitan-style with San Marzano sauce, fresh mozzarella, and hand-torn basil.',
  'Italian', 'medium', 90, 12, 2,
  'https://image.pollinations.ai/prompt/overhead%20food%20photography%20margherita%20pizza%20mozzarella%20basil%20tomato%20wood%20board?width=800&height=800&seed=1014&nologo=true',
  '{"salt":60,"sweet":30,"umami":70,"spice":10,"acid":45}'::jsonb,
  '[{"amount":"300","unit":"g","name":"bread flour"},{"amount":"7","unit":"g","name":"yeast"},{"amount":"200","unit":"g","name":"canned crushed tomato"},{"amount":"200","unit":"g","name":"fresh mozzarella"},{"amount":"","unit":"","name":"basil"},{"amount":"2","unit":"tbsp","name":"extra virgin olive oil"}]'::jsonb,
  '[{"order":1,"instruction":"Mix flour, yeast, salt, and water. Knead 10 minutes until smooth. Rest 1 hour until doubled."},{"order":2,"instruction":"Simmer crushed tomatoes with garlic and a pinch of salt 10 minutes."},{"order":3,"instruction":"Stretch dough thin on a floured surface. Transfer to a hot baking stone at 250C preheated 1 hour."},{"order":4,"instruction":"Spoon sauce within 1cm of edge. Tear mozzarella over top. Bake 10-12 minutes until blistered."},{"order":5,"instruction":"Tear fresh basil over the hot pizza. Drizzle olive oil, serve immediately."}]'::jsonb,
  true, ARRAY['Italian']
),

-- 15. Butter Chicken
(
  '00000000-0000-0000-0000-000000000015',
  '00000000-0000-0000-0000-0000000becee',
  'Butter Chicken',
  'Tender tandoori chicken in a velvety tomato-butter sauce, mild enough for everyone.',
  'Indian', 'medium', 20, 40, 4,
  'https://image.pollinations.ai/prompt/overhead%20food%20photography%20butter%20chicken%20orange%20sauce%20rice%20cilantro%20naan?width=800&height=800&seed=1015&nologo=true',
  '{"salt":60,"sweet":45,"umami":70,"spice":50,"acid":30}'::jsonb,
  '[{"amount":"700","unit":"g","name":"chicken thigh"},{"amount":"150","unit":"g","name":"plain yogurt"},{"amount":"2","unit":"tsp","name":"garam masala"},{"amount":"400","unit":"g","name":"canned crushed tomato"},{"amount":"3","unit":"tbsp","name":"unsalted butter"},{"amount":"150","unit":"ml","name":"heavy cream"}]'::jsonb,
  '[{"order":1,"instruction":"Marinate chicken in yogurt, spices, salt for 1 hour. Grill or broil until charred, cut into pieces."},{"order":2,"instruction":"Fry onion in butter until golden. Add garlic, ginger, remaining spices, cook 2 minutes."},{"order":3,"instruction":"Add tomatoes, simmer 20 minutes. Blend smooth."},{"order":4,"instruction":"Return to pan, add cream and chicken. Simmer 10 minutes. Finish with a cold knob of butter. Serve with rice."}]'::jsonb,
  true, ARRAY['Indian']
),
-- 16. Avocado Toast
(
  '00000000-0000-0000-0000-000000000016',
  '00000000-0000-0000-0000-0000000becee',
  'Avocado Toast with Poached Egg',
  'Smashed avocado with red pepper flakes and lemon, topped with a perfectly poached egg.',
  'American', 'easy', 8, 5, 2,
  'https://image.pollinations.ai/prompt/overhead%20food%20photography%20avocado%20toast%20poached%20egg%20flaky%20salt%20sourdough?width=800&height=800&seed=1016&nologo=true',
  '{"salt":55,"sweet":15,"umami":50,"spice":30,"acid":50}'::jsonb,
  '[{"amount":"2","unit":"slices","name":"sourdough bread"},{"amount":"2","unit":"","name":"ripe avocado"},{"amount":"1","unit":"tbsp","name":"lemon juice"},{"amount":"2","unit":"","name":"egg"},{"amount":"","unit":"","name":"flaky sea salt"},{"amount":"0.5","unit":"tsp","name":"red pepper flake"}]'::jsonb,
  '[{"order":1,"instruction":"Toast sourdough until golden and crisp."},{"order":2,"instruction":"Halve avocados, scoop flesh. Smash with lemon juice, salt, and red pepper flakes — leave it chunky."},{"order":3,"instruction":"Bring 8cm of water to a gentle simmer with vinegar. Swirl water. Crack egg into ramekin, slip gently into swirl. Cook 3 minutes. Lift with slotted spoon."},{"order":4,"instruction":"Spread avocado on toast. Top with poached egg. Finish with flaky salt and cracked pepper."}]'::jsonb,
  true, ARRAY['American']
),

-- 17. Beef Bulgogi
(
  '00000000-0000-0000-0000-000000000017',
  '00000000-0000-0000-0000-0000000becee',
  'Beef Bulgogi',
  'Paper-thin marinated beef, griddled to caramelized perfection with sesame and pear.',
  'Korean', 'easy', 30, 10, 4,
  'https://image.pollinations.ai/prompt/overhead%20food%20photography%20beef%20bulgogi%20korean%20sesame%20lettuce%20wrap%20rice?width=800&height=800&seed=1017&nologo=true',
  '{"salt":65,"sweet":60,"umami":85,"spice":35,"acid":25}'::jsonb,
  '[{"amount":"500","unit":"g","name":"ribeye steak"},{"amount":"0.5","unit":"","name":"asian pear"},{"amount":"4","unit":"tbsp","name":"soy sauce"},{"amount":"2","unit":"tbsp","name":"sugar"},{"amount":"2","unit":"tbsp","name":"sesame oil"},{"amount":"2","unit":"","name":"scallion"},{"amount":"1","unit":"tsp","name":"sesame seed"}]'::jsonb,
  '[{"order":1,"instruction":"Freeze beef 30 minutes, then slice paper thin against the grain."},{"order":2,"instruction":"Grate pear and ginger. Mix with garlic, soy sauce, sugar, sesame oil, and sake."},{"order":3,"instruction":"Marinate beef 30 minutes minimum."},{"order":4,"instruction":"Griddle or BBQ on highest heat in batches. Caramelization is key — do not crowd the pan."},{"order":5,"instruction":"Garnish with scallion and sesame seeds. Serve with rice and lettuce for wrapping."}]'::jsonb,
  true, ARRAY['Korean']
),

-- 18. Gazpacho
(
  '00000000-0000-0000-0000-000000000018',
  '00000000-0000-0000-0000-0000000becee',
  'Andalusian Gazpacho',
  'Icy blended raw tomato soup with sherry vinegar, cucumber, and a glug of olive oil.',
  'Mediterranean', 'easy', 20, 0, 4,
  'https://image.pollinations.ai/prompt/overhead%20food%20photography%20gazpacho%20tomato%20soup%20olive%20oil%20cucumber%20white%20bowl?width=800&height=800&seed=1018&nologo=true',
  '{"salt":55,"sweet":30,"umami":55,"spice":20,"acid":70}'::jsonb,
  '[{"amount":"1","unit":"kg","name":"ripe tomato"},{"amount":"1","unit":"","name":"english cucumber"},{"amount":"1","unit":"","name":"red bell pepper"},{"amount":"3","unit":"tbsp","name":"sherry vinegar"},{"amount":"4","unit":"tbsp","name":"extra virgin olive oil"},{"amount":"50","unit":"g","name":"day-old bread"}]'::jsonb,
  '[{"order":1,"instruction":"Roughly chop all vegetables. Soak bread in water 5 minutes, squeeze out excess."},{"order":2,"instruction":"Blend everything together on high until completely smooth. Add ice water to consistency you like."},{"order":3,"instruction":"Season aggressively with salt, vinegar, and pepper. Chill 2 hours."},{"order":4,"instruction":"Serve in chilled bowls with a swirl of olive oil and finely diced cucumber on top."}]'::jsonb,
  true, ARRAY['Mediterranean']
),

-- 19. Mushroom Risotto
(
  '00000000-0000-0000-0000-000000000019',
  '00000000-0000-0000-0000-0000000becee',
  'Mushroom Risotto',
  'Creamy Arborio rice with wild mushrooms, dry white wine, and a Parmigiano finish.',
  'Italian', 'medium', 15, 35, 4,
  'https://image.pollinations.ai/prompt/overhead%20food%20photography%20mushroom%20risotto%20parmesan%20truffle%20oil%20white%20bowl?width=800&height=800&seed=1019&nologo=true',
  '{"salt":65,"sweet":15,"umami":90,"spice":10,"acid":25}'::jsonb,
  '[{"amount":"300","unit":"g","name":"arborio rice"},{"amount":"400","unit":"g","name":"mixed mushroom"},{"amount":"150","unit":"ml","name":"dry white wine"},{"amount":"1","unit":"L","name":"chicken stock"},{"amount":"60","unit":"g","name":"parmesan"},{"amount":"3","unit":"tbsp","name":"unsalted butter"}]'::jsonb,
  '[{"order":1,"instruction":"Keep stock warm in a separate pot. Saute mushrooms in butter and oil on high heat until golden and all moisture has evaporated. Season and set aside."},{"order":2,"instruction":"Soften onion in butter. Add garlic. Add rice, toast 2 minutes stirring constantly."},{"order":3,"instruction":"Add wine, stir until absorbed. Add hot stock one ladle at a time, stirring after each addition until absorbed, about 18-20 minutes."},{"order":4,"instruction":"Stir in mushrooms, Parmesan, and remaining cold butter. Cover 2 minutes. Finish with parsley. Serve immediately."}]'::jsonb,
  true, ARRAY['Italian']
),

-- 20. Crispy Falafel
(
  '00000000-0000-0000-0000-000000000020',
  '00000000-0000-0000-0000-0000000becee',
  'Crispy Falafel',
  'Deeply green herb-packed chickpea fritters, shatteringly crisp outside and fluffy within.',
  'Middle Eastern', 'medium', 20, 15, 4,
  'https://image.pollinations.ai/prompt/overhead%20food%20photography%20crispy%20falafel%20tahini%20herbs%20pita%20platter?width=800&height=800&seed=1020&nologo=true',
  '{"salt":55,"sweet":10,"umami":45,"spice":50,"acid":35}'::jsonb,
  '[{"amount":"400","unit":"g","name":"dried chickpea"},{"amount":"1","unit":"cup","name":"flat-leaf parsley"},{"amount":"1","unit":"cup","name":"cilantro"},{"amount":"2","unit":"tsp","name":"cumin"},{"amount":"1","unit":"tsp","name":"coriander"},{"amount":"1","unit":"tsp","name":"baking powder"}]'::jsonb,
  '[{"order":1,"instruction":"Soak dried chickpeas in cold water 24 hours. Drain. Do not use canned — they are too wet."},{"order":2,"instruction":"Pulse chickpeas, onion, garlic, herbs, and spices in a food processor until a coarse damp crumb forms. Season. Chill 30 minutes."},{"order":3,"instruction":"Mix in baking powder. Form into balls, about 40g each. Deep fry at 180C in batches until deep brown, 3-4 minutes."},{"order":4,"instruction":"Drain on paper. Serve immediately in pita with tahini, tomato, and pickled onion."}]'::jsonb,
  true, ARRAY['Middle Eastern']
),
-- 21. Sunday Bolognese
(
  '00000000-0000-0000-0000-000000000021',
  '00000000-0000-0000-0000-0000000becee',
  'Sunday Bolognese',
  'A slow-cooked meat ragu that only gets better the longer it simmers — rich, not saucy.',
  'Italian', 'hard', 20, 180, 6,
  'https://image.pollinations.ai/prompt/overhead%20food%20photography%20spaghetti%20bolognese%20meat%20sauce%20parmesan%20white%20bowl?width=800&height=800&seed=1021&nologo=true',
  '{"salt":65,"sweet":30,"umami":90,"spice":15,"acid":35}'::jsonb,
  '[{"amount":"400","unit":"g","name":"ground beef"},{"amount":"200","unit":"g","name":"ground pork"},{"amount":"150","unit":"g","name":"pancetta"},{"amount":"200","unit":"ml","name":"dry white wine"},{"amount":"200","unit":"ml","name":"whole milk"},{"amount":"400","unit":"g","name":"canned crushed tomato"},{"amount":"400","unit":"g","name":"tagliatelle"}]'::jsonb,
  '[{"order":1,"instruction":"Finely dice onion, carrot, and celery (soffritto). Cook in olive oil and butter 20 minutes until very soft."},{"order":2,"instruction":"Add pancetta, cook until fat renders. Add beef and pork, brown well, breaking up clumps."},{"order":3,"instruction":"Add wine, cook until evaporated. Add milk, cook until evaporated. Add tomatoes. Season."},{"order":4,"instruction":"Simmer on lowest heat, partially covered, 2-3 hours. Add water if it catches. Sauce should be thick."},{"order":5,"instruction":"Cook pasta al dente. Toss with sauce and pasta water. Serve with Parmesan."}]'::jsonb,
  true, ARRAY['Italian']
),

-- 22. Tom Yum
(
  '00000000-0000-0000-0000-000000000022',
  '00000000-0000-0000-0000-0000000becee',
  'Tom Yum Soup',
  'Hot-sour Thai broth with shrimp, galangal, lemongrass, and kaffir lime leaves.',
  'Thai', 'easy', 15, 15, 4,
  'https://image.pollinations.ai/prompt/overhead%20food%20photography%20tom%20yum%20soup%20shrimp%20mushroom%20lemongrass%20bowl?width=800&height=800&seed=1022&nologo=true',
  '{"salt":65,"sweet":20,"umami":75,"spice":80,"acid":75}'::jsonb,
  '[{"amount":"1","unit":"L","name":"chicken broth"},{"amount":"300","unit":"g","name":"shrimp"},{"amount":"2","unit":"stalks","name":"lemongrass"},{"amount":"4","unit":"","name":"kaffir lime leaf"},{"amount":"2","unit":"","name":"red chili"},{"amount":"3","unit":"tbsp","name":"fish sauce"},{"amount":"3","unit":"tbsp","name":"lime juice"}]'::jsonb,
  '[{"order":1,"instruction":"Smash lemongrass. Simmer broth with lemongrass, kaffir lime leaves, and ginger 10 minutes."},{"order":2,"instruction":"Add mushrooms, simmer 3 minutes. Add shrimp, cook 2 minutes until pink."},{"order":3,"instruction":"Season with fish sauce, lime juice, and sugar. Balance to your taste — it should be sharp and punchy."},{"order":4,"instruction":"Add sliced chili. Scatter cilantro. Serve immediately."}]'::jsonb,
  true, ARRAY['Thai']
),

-- 23. Birria Tacos
(
  '00000000-0000-0000-0000-000000000023',
  '00000000-0000-0000-0000-0000000becee',
  'Birria Tacos',
  'Slow-braised beef in dried-chili consomme, dipped and griddle-crisped in tortillas.',
  'Mexican', 'hard', 30, 180, 6,
  'https://image.pollinations.ai/prompt/overhead%20food%20photography%20birria%20tacos%20consomme%20cheese%20crispy%20tortilla%20red?width=800&height=800&seed=1023&nologo=true',
  '{"salt":70,"sweet":25,"umami":85,"spice":65,"acid":35}'::jsonb,
  '[{"amount":"1.5","unit":"kg","name":"beef chuck"},{"amount":"4","unit":"","name":"dried guajillo chili"},{"amount":"3","unit":"","name":"dried ancho chili"},{"amount":"12","unit":"","name":"corn tortilla"},{"amount":"200","unit":"g","name":"monterey jack cheese"},{"amount":"","unit":"","name":"cilantro"}]'::jsonb,
  '[{"order":1,"instruction":"Toast dried chilies in a dry skillet 30 seconds. Soak in hot water 20 minutes. Blend with tomatoes, aromatics, and spices."},{"order":2,"instruction":"Season beef, brown in a Dutch oven. Add blended chili sauce and enough water to cover. Braise 3 hours at 160C until meat falls apart."},{"order":3,"instruction":"Remove beef, shred. Reserve consomme — this is the dipping broth."},{"order":4,"instruction":"Dip tortillas in consomme, griddle in a dry pan until sizzling. Add cheese and shredded beef, fold, press until crisp."},{"order":5,"instruction":"Serve tacos with a small bowl of consomme for dipping, diced onion, cilantro, and lime."}]'::jsonb,
  true, ARRAY['Mexican']
),

-- 24. Salmon Eggs Benedict
(
  '00000000-0000-0000-0000-000000000024',
  '00000000-0000-0000-0000-0000000becee',
  'Salmon Eggs Benedict',
  'Silky hollandaise over smoked salmon and a perfectly poached egg on a toasted English muffin.',
  'American', 'hard', 15, 20, 2,
  'https://image.pollinations.ai/prompt/overhead%20food%20photography%20eggs%20benedict%20salmon%20hollandaise%20english%20muffin?width=800&height=800&seed=1024&nologo=true',
  '{"salt":70,"sweet":20,"umami":75,"spice":15,"acid":50}'::jsonb,
  '[{"amount":"2","unit":"","name":"english muffin"},{"amount":"100","unit":"g","name":"smoked salmon"},{"amount":"4","unit":"","name":"egg"},{"amount":"3","unit":"","name":"egg yolk"},{"amount":"200","unit":"g","name":"unsalted butter"},{"amount":"1","unit":"tbsp","name":"lemon juice"}]'::jsonb,
  '[{"order":1,"instruction":"Make hollandaise: melt butter, keep warm. Whisk yolks with lemon juice over barely simmering water until thick and doubled. Drizzle in melted butter while whisking. Season with cayenne and salt."},{"order":2,"instruction":"Poach eggs: simmer water with vinegar, swirl, drop eggs in for 3 minutes. Remove with a slotted spoon."},{"order":3,"instruction":"Toast English muffin halves. Layer smoked salmon on each."},{"order":4,"instruction":"Place poached egg on salmon. Spoon hollandaise over. Scatter chives."}]'::jsonb,
  true, ARRAY['American']
),

-- 25. Dal Tadka
(
  '00000000-0000-0000-0000-000000000025',
  '00000000-0000-0000-0000-0000000becee',
  'Dal Tadka',
  'Comfort food at its finest: yellow lentils cooked down soft and finished with a sizzling spiced butter temper.',
  'Indian', 'easy', 10, 30, 4,
  'https://image.pollinations.ai/prompt/overhead%20food%20photography%20dal%20tadka%20lentil%20turmeric%20ghee%20temper%20rice%20indian?width=800&height=800&seed=1025&nologo=true',
  '{"salt":60,"sweet":20,"umami":65,"spice":70,"acid":30}'::jsonb,
  '[{"amount":"300","unit":"g","name":"red lentil"},{"amount":"1","unit":"tsp","name":"turmeric"},{"amount":"2","unit":"tbsp","name":"ghee"},{"amount":"1","unit":"tsp","name":"cumin seed"},{"amount":"2","unit":"","name":"dried chili"},{"amount":"0.5","unit":"tsp","name":"garam masala"}]'::jsonb,
  '[{"order":1,"instruction":"Rinse lentils. Simmer with turmeric and water 20 minutes until soft."},{"order":2,"instruction":"Fry onion in ghee until golden. Add garlic, ginger, tomatoes, cook 10 minutes."},{"order":3,"instruction":"Combine with lentils, simmer 5 minutes. Season."},{"order":4,"instruction":"Tadka: heat ghee in a small pan until shimmering, add cumin seeds and dried chilies. They will sizzle and pop. Pour immediately over dal."},{"order":5,"instruction":"Scatter garam masala and cilantro. Serve with rice or roti."}]'::jsonb,
  true, ARRAY['Indian']
),
-- 26. New England Clam Chowder
(
  '00000000-0000-0000-0000-000000000026',
  '00000000-0000-0000-0000-0000000becee',
  'New England Clam Chowder',
  'Creamy chowder thick with clams, potato, and smoky bacon — best in a sourdough bowl.',
  'American', 'medium', 20, 35, 6,
  'https://image.pollinations.ai/prompt/overhead%20food%20photography%20new%20england%20clam%20chowder%20sourdough%20bowl%20bacon%20cream?width=800&height=800&seed=1026&nologo=true',
  '{"salt":70,"sweet":25,"umami":80,"spice":15,"acid":20}'::jsonb,
  '[{"amount":"1","unit":"kg","name":"clam"},{"amount":"150","unit":"g","name":"bacon"},{"amount":"4","unit":"","name":"yukon gold potato"},{"amount":"500","unit":"ml","name":"whole milk"},{"amount":"200","unit":"ml","name":"heavy cream"},{"amount":"3","unit":"tbsp","name":"all-purpose flour"}]'::jsonb,
  '[{"order":1,"instruction":"Steam clams in 1 cup water until opened, 5-7 minutes. Remove clams, reserve broth through a fine sieve."},{"order":2,"instruction":"Fry bacon until crisp. Remove, leave fat in pot. Soften onion and celery in bacon fat."},{"order":3,"instruction":"Add flour, cook 2 minutes. Gradually add clam broth and milk, whisking to smooth."},{"order":4,"instruction":"Add potatoes, thyme, bay leaf. Simmer 15 minutes until potatoes are tender."},{"order":5,"instruction":"Stir in cream and clam meat. Heat through. Season. Top with bacon and parsley."}]'::jsonb,
  true, ARRAY['American']
),

-- 27. Chocolate Lava Cake
(
  '00000000-0000-0000-0000-000000000027',
  '00000000-0000-0000-0000-0000000becee',
  'Chocolate Lava Cake',
  'Molten-centered dark chocolate cakes that collapse into a glossy sauce when you break in.',
  'French', 'medium', 15, 12, 4,
  'https://image.pollinations.ai/prompt/overhead%20food%20photography%20chocolate%20lava%20cake%20molten%20center%20ice%20cream%20dark?width=800&height=800&seed=1027&nologo=true',
  '{"salt":25,"sweet":90,"umami":20,"spice":10,"acid":15}'::jsonb,
  '[{"amount":"200","unit":"g","name":"dark chocolate"},{"amount":"100","unit":"g","name":"unsalted butter"},{"amount":"4","unit":"","name":"egg"},{"amount":"4","unit":"","name":"egg yolk"},{"amount":"120","unit":"g","name":"powdered sugar"},{"amount":"50","unit":"g","name":"all-purpose flour"}]'::jsonb,
  '[{"order":1,"instruction":"Preheat oven to 220C. Butter 4 ramekins, dust with cocoa powder."},{"order":2,"instruction":"Melt chocolate and butter together over a bain-marie. Cool slightly."},{"order":3,"instruction":"Whisk eggs, yolks, and sugar until pale. Fold in chocolate mixture and flour gently."},{"order":4,"instruction":"Fill ramekins 3/4 full. Bake 10-12 minutes until edges are set but center jiggles."},{"order":5,"instruction":"Rest 1 minute. Run a knife around edge, invert onto plates. Serve immediately with vanilla ice cream."}]'::jsonb,
  true, ARRAY['French']
),

-- 28. Thai Green Curry
(
  '00000000-0000-0000-0000-000000000028',
  '00000000-0000-0000-0000-0000000becee',
  'Thai Green Curry',
  'Fragrant green curry paste simmered in coconut milk with chicken, aubergine, and Thai basil.',
  'Thai', 'easy', 15, 20, 4,
  'https://image.pollinations.ai/prompt/overhead%20food%20photography%20thai%20green%20curry%20coconut%20milk%20eggplant%20basil%20rice?width=800&height=800&seed=1028&nologo=true',
  '{"salt":60,"sweet":45,"umami":65,"spice":70,"acid":30}'::jsonb,
  '[{"amount":"500","unit":"g","name":"chicken thigh"},{"amount":"400","unit":"ml","name":"canned coconut milk"},{"amount":"3","unit":"tbsp","name":"green curry paste"},{"amount":"1","unit":"","name":"japanese eggplant"},{"amount":"2","unit":"tbsp","name":"fish sauce"},{"amount":"1","unit":"tbsp","name":"sugar"}]'::jsonb,
  '[{"order":1,"instruction":"Fry green curry paste in the thick top cream of the coconut milk over medium heat until fragrant, 2 minutes."},{"order":2,"instruction":"Add chicken, stirring to coat. Add remaining coconut milk, lemongrass, and kaffir lime leaves. Simmer 10 minutes."},{"order":3,"instruction":"Add eggplant, cook 5 minutes. Add snow peas, fish sauce, and sugar. Balance seasoning."},{"order":4,"instruction":"Stir in Thai basil. Serve over jasmine rice."}]'::jsonb,
  true, ARRAY['Thai']
),

-- 29. Boeuf Bourguignon
(
  '00000000-0000-0000-0000-000000000029',
  '00000000-0000-0000-0000-0000000becee',
  'Boeuf Bourguignon',
  'Classic Burgundy beef braise in red wine with pearl onions, mushrooms, and lardons.',
  'French', 'hard', 40, 180, 6,
  'https://image.pollinations.ai/prompt/overhead%20food%20photography%20boeuf%20bourguignon%20red%20wine%20mushrooms%20dutch%20oven?width=800&height=800&seed=1029&nologo=true',
  '{"salt":65,"sweet":25,"umami":90,"spice":15,"acid":40}'::jsonb,
  '[{"amount":"1.5","unit":"kg","name":"beef chuck"},{"amount":"200","unit":"g","name":"bacon"},{"amount":"300","unit":"g","name":"cremini mushroom"},{"amount":"750","unit":"ml","name":"dry red wine"},{"amount":"300","unit":"ml","name":"beef stock"},{"amount":"3","unit":"tbsp","name":"tomato paste"}]'::jsonb,
  '[{"order":1,"instruction":"Marinate beef in wine with vegetables and herbs overnight. Drain, reserving the wine."},{"order":2,"instruction":"Pat beef dry, season, brown in batches in a Dutch oven. Brown vegetables."},{"order":3,"instruction":"Add tomato paste and flour, cook 2 minutes. Return beef, pour in wine and stock to just cover."},{"order":4,"instruction":"Cover and braise in the oven at 160C for 2.5-3 hours. Beef should yield to a spoon."},{"order":5,"instruction":"Saute mushrooms and pearl onions separately until golden. Add to stew in final 30 minutes. Serve with mashed potato or crusty bread."}]'::jsonb,
  true, ARRAY['French']
),

-- 30. Pistachio Baklava
(
  '00000000-0000-0000-0000-000000000030',
  '00000000-0000-0000-0000-0000000becee',
  'Pistachio Baklava',
  'Layers of shatteringly crisp phyllo, roasted pistachios, and rose-scented honey syrup.',
  'Middle Eastern', 'hard', 40, 40, 20,
  'https://image.pollinations.ai/prompt/overhead%20food%20photography%20pistachio%20baklava%20honey%20syrup%20gold%20pastry?width=800&height=800&seed=1030&nologo=true',
  '{"salt":20,"sweet":95,"umami":15,"spice":20,"acid":15}'::jsonb,
  '[{"amount":"1","unit":"pack","name":"phyllo pastry"},{"amount":"200","unit":"g","name":"unsalted butter"},{"amount":"300","unit":"g","name":"pistachio"},{"amount":"200","unit":"g","name":"walnut"},{"amount":"2","unit":"tsp","name":"cinnamon"},{"amount":"200","unit":"g","name":"honey"},{"amount":"1","unit":"tbsp","name":"rose water"}]'::jsonb,
  '[{"order":1,"instruction":"Toast and roughly chop nuts. Mix with cinnamon."},{"order":2,"instruction":"Butter a 33x23cm pan. Layer 8 sheets phyllo, brushing each with melted butter."},{"order":3,"instruction":"Add half the nut mixture. Add 4 sheets phyllo, brushing each. Add remaining nuts. Top with 8 sheets phyllo, each buttered."},{"order":4,"instruction":"Cut into diamond shapes before baking. Bake at 175C for 35 minutes until deep golden."},{"order":5,"instruction":"Meanwhile, simmer syrup ingredients 10 minutes. Add rose water off heat. Pour cold syrup over hot baklava. Rest at least 4 hours."}]'::jsonb,
  true, ARRAY['Middle Eastern']
),
-- 31. Kimchi Jjigae
(
  '00000000-0000-0000-0000-000000000031',
  '00000000-0000-0000-0000-0000000becee',
  'Kimchi Jjigae',
  'Funky, deeply sour aged kimchi stew with pork belly and soft silken tofu.',
  'Korean', 'easy', 10, 30, 4,
  'https://image.pollinations.ai/prompt/overhead%20food%20photography%20kimchi%20jjigae%20stew%20tofu%20pork%20korean%20pot?width=800&height=800&seed=1031&nologo=true',
  '{"salt":80,"sweet":20,"umami":90,"spice":85,"acid":75}'::jsonb,
  '[{"amount":"300","unit":"g","name":"aged kimchi"},{"amount":"200","unit":"g","name":"pork belly"},{"amount":"300","unit":"g","name":"silken tofu"},{"amount":"2","unit":"tbsp","name":"gochujang"},{"amount":"1","unit":"tbsp","name":"sesame oil"},{"amount":"2","unit":"","name":"scallion"}]'::jsonb,
  '[{"order":1,"instruction":"Stir-fry pork belly in sesame oil until browned. Add kimchi and kimchi brine, stir-fry 3 minutes."},{"order":2,"instruction":"Add garlic, onion, gochujang, and water. Bring to a boil, reduce to simmer 20 minutes."},{"order":3,"instruction":"Add tofu in large pieces. Heat through. Season with soy sauce."},{"order":4,"instruction":"Scatter scallion. Serve in the pot over rice."}]'::jsonb,
  true, ARRAY['Korean']
),

-- 32. Butter Croissants
(
  '00000000-0000-0000-0000-000000000032',
  '00000000-0000-0000-0000-0000000becee',
  'Butter Croissants',
  'Weekend project croissants: laminated dough with 27 buttery layers, shattery and honeycomb inside.',
  'French', 'hard', 120, 20, 8,
  'https://image.pollinations.ai/prompt/overhead%20food%20photography%20fresh%20butter%20croissants%20flaky%20golden%20bakery?width=800&height=800&seed=1032&nologo=true',
  '{"salt":35,"sweet":30,"umami":15,"spice":5,"acid":20}'::jsonb,
  '[{"amount":"500","unit":"g","name":"bread flour"},{"amount":"10","unit":"g","name":"yeast"},{"amount":"50","unit":"g","name":"sugar"},{"amount":"300","unit":"ml","name":"whole milk"},{"amount":"280","unit":"g","name":"unsalted butter"},{"amount":"1","unit":"","name":"egg"}]'::jsonb,
  '[{"order":1,"instruction":"Mix flour, yeast, salt, sugar, 30g butter, and milk into a dough. Knead 5 minutes. Rest overnight in fridge."},{"order":2,"instruction":"Bash 250g cold butter into a 20cm square. Roll dough into a rectangle, enclose butter. Fold into thirds. Refrigerate 30 minutes."},{"order":3,"instruction":"Repeat rolling and folding 2 more times with 30-minute rests. After 3 turns, you have 27 layers."},{"order":4,"instruction":"Roll dough 4mm thick. Cut into long triangles. Roll from base to tip into croissant shapes. Proof 2-3 hours until puffy."},{"order":5,"instruction":"Brush with egg wash. Bake at 190C for 18-20 minutes until deep amber."}]'::jsonb,
  true, ARRAY['French']
),

-- 33. Mapo Tofu
(
  '00000000-0000-0000-0000-000000000033',
  '00000000-0000-0000-0000-0000000becee',
  'Mapo Tofu',
  'Silken tofu in a fiery numbing Sichuan sauce with ground pork and black bean paste.',
  'Chinese', 'easy', 10, 15, 4,
  'https://image.pollinations.ai/prompt/overhead%20food%20photography%20mapo%20tofu%20sichuan%20chili%20oil%20ground%20pork%20bowl?width=800&height=800&seed=1033&nologo=true',
  '{"salt":75,"sweet":15,"umami":90,"spice":90,"acid":20}'::jsonb,
  '[{"amount":"500","unit":"g","name":"silken tofu"},{"amount":"150","unit":"g","name":"ground pork"},{"amount":"2","unit":"tbsp","name":"doenjang"},{"amount":"1","unit":"tsp","name":"sichuan peppercorn"},{"amount":"2","unit":"tbsp","name":"soy sauce"},{"amount":"200","unit":"ml","name":"chicken broth"}]'::jsonb,
  '[{"order":1,"instruction":"Toast Sichuan peppercorn, grind roughly. Set aside."},{"order":2,"instruction":"Fry pork in oil until browned. Add garlic, ginger, doenjang, and gochujang, fry 1 minute."},{"order":3,"instruction":"Add broth and soy sauce, bring to a boil. Add tofu cubes gently — do not stir, swirl the pan."},{"order":4,"instruction":"Add cornstarch slurry to thicken sauce. Simmer 3 minutes. Top with scallion and ground Sichuan pepper."}]'::jsonb,
  true, ARRAY['Chinese']
),

-- 34. Overnight Oats
(
  '00000000-0000-0000-0000-000000000034',
  '00000000-0000-0000-0000-0000000becee',
  'Overnight Oats',
  'Creamy no-cook oats layered with fruit and honey — five minutes of prep the night before.',
  'American', 'easy', 5, 0, 2,
  'https://image.pollinations.ai/prompt/overhead%20food%20photography%20overnight%20oats%20blueberry%20granola%20honey%20jar%20marble?width=800&height=800&seed=1034&nologo=true',
  '{"salt":15,"sweet":65,"umami":5,"spice":10,"acid":25}'::jsonb,
  '[{"amount":"160","unit":"g","name":"rolled oat"},{"amount":"300","unit":"ml","name":"oat milk"},{"amount":"80","unit":"g","name":"greek yogurt"},{"amount":"2","unit":"tbsp","name":"chia seed"},{"amount":"2","unit":"tbsp","name":"maple syrup"},{"amount":"100","unit":"g","name":"blueberry"}]'::jsonb,
  '[{"order":1,"instruction":"Combine oats, oat milk, yogurt, chia seeds, maple syrup, and vanilla in a jar. Stir well."},{"order":2,"instruction":"Cover and refrigerate overnight. The chia seeds will swell and oats will soften to a creamy consistency."},{"order":3,"instruction":"In the morning, stir and add a splash more milk if needed. Top with fresh blueberries and granola for crunch."}]'::jsonb,
  true, ARRAY['American']
),

-- 35. Classic Guacamole
(
  '00000000-0000-0000-0000-000000000035',
  '00000000-0000-0000-0000-0000000becee',
  'Classic Guacamole',
  'Chunky hand-smashed avocado with jalapeno, lime, and onion — made in a molcajete.',
  'Mexican', 'easy', 10, 0, 4,
  'https://image.pollinations.ai/prompt/overhead%20food%20photography%20guacamole%20avocado%20lime%20cilantro%20chips%20molcajete?width=800&height=800&seed=1035&nologo=true',
  '{"salt":55,"sweet":15,"umami":35,"spice":50,"acid":65}'::jsonb,
  '[{"amount":"3","unit":"","name":"ripe avocado"},{"amount":"1","unit":"","name":"lime"},{"amount":"0.5","unit":"","name":"white onion"},{"amount":"1","unit":"","name":"jalapeno"},{"amount":"0.5","unit":"cup","name":"cilantro"},{"amount":"1","unit":"","name":"roma tomato"}]'::jsonb,
  '[{"order":1,"instruction":"Halve and pit avocados. Scoop flesh into a bowl."},{"order":2,"instruction":"Squeeze lime over avocado. Mash with a fork to your preferred texture — leave some chunks."},{"order":3,"instruction":"Fold in finely diced onion, jalapeno, tomato, and chopped cilantro."},{"order":4,"instruction":"Season with salt until it pops. Taste — it should be bright and limey. Serve immediately."}]'::jsonb,
  true, ARRAY['Mexican']
),
-- 36. Tiramisu
(
  '00000000-0000-0000-0000-000000000036',
  '00000000-0000-0000-0000-0000000becee',
  'Tiramisu',
  'Espresso-soaked ladyfingers layered with whipped mascarpone cream, blanketed in cocoa.',
  'Italian', 'medium', 30, 0, 8,
  'https://image.pollinations.ai/prompt/overhead%20food%20photography%20tiramisu%20cocoa%20cream%20espresso%20white%20dish%20close%20up?width=800&height=800&seed=1036&nologo=true',
  '{"salt":20,"sweet":80,"umami":25,"spice":5,"acid":25}'::jsonb,
  '[{"amount":"500","unit":"g","name":"mascarpone"},{"amount":"6","unit":"","name":"egg"},{"amount":"120","unit":"g","name":"sugar"},{"amount":"300","unit":"ml","name":"espresso"},{"amount":"3","unit":"tbsp","name":"rum"},{"amount":"200","unit":"g","name":"ladyfinger biscuit"}]'::jsonb,
  '[{"order":1,"instruction":"Separate eggs. Whisk yolks with sugar over bain-marie until pale and thick. Remove from heat, cool."},{"order":2,"instruction":"Beat mascarpone into yolk mixture until smooth."},{"order":3,"instruction":"Whisk egg whites to stiff peaks. Fold gently into mascarpone cream in three additions."},{"order":4,"instruction":"Mix espresso and rum in a shallow dish. Quickly dip ladyfingers — 2 seconds each side."},{"order":5,"instruction":"Arrange a layer of soaked ladyfingers in a dish. Spread half the cream. Repeat. Refrigerate 6 hours minimum. Dust with cocoa powder before serving."}]'::jsonb,
  true, ARRAY['Italian']
),

-- 37. Ahi Tuna Poke Bowl
(
  '00000000-0000-0000-0000-000000000037',
  '00000000-0000-0000-0000-0000000becee',
  'Ahi Tuna Poke Bowl',
  'Cubed sushi-grade tuna in soy-sesame dressing over sushi rice with avocado and cucumber.',
  'Japanese', 'easy', 20, 20, 2,
  'https://image.pollinations.ai/prompt/overhead%20food%20photography%20ahi%20tuna%20poke%20bowl%20avocado%20edamame%20sesame?width=800&height=800&seed=1037&nologo=true',
  '{"salt":65,"sweet":30,"umami":80,"spice":25,"acid":45}'::jsonb,
  '[{"amount":"300","unit":"g","name":"tuna steak"},{"amount":"2","unit":"tbsp","name":"soy sauce"},{"amount":"1","unit":"tbsp","name":"sesame oil"},{"amount":"300","unit":"g","name":"sushi rice"},{"amount":"1","unit":"","name":"avocado"},{"amount":"100","unit":"g","name":"edamame"}]'::jsonb,
  '[{"order":1,"instruction":"Cook sushi rice, season with rice vinegar, sugar, and salt. Fan to cool."},{"order":2,"instruction":"Cube tuna 2cm. Toss gently with soy sauce, sesame oil, rice vinegar, and sriracha."},{"order":3,"instruction":"Divide rice into bowls. Arrange tuna, sliced avocado, cucumber, and edamame over rice."},{"order":4,"instruction":"Scatter scallion, sesame seeds, and drizzle any remaining marinade."}]'::jsonb,
  true, ARRAY['Japanese']
),

-- 38. French Lemon Tart
(
  '00000000-0000-0000-0000-000000000038',
  '00000000-0000-0000-0000-0000000becee',
  'French Lemon Tart',
  'Silky, intensely lemony curd in a butter pastry shell — simple and perfect.',
  'French', 'hard', 40, 35, 8,
  'https://image.pollinations.ai/prompt/overhead%20food%20photography%20french%20lemon%20tart%20curd%20pastry%20powdered%20sugar?width=800&height=800&seed=1038&nologo=true',
  '{"salt":20,"sweet":70,"umami":5,"spice":5,"acid":85}'::jsonb,
  '[{"amount":"200","unit":"g","name":"all-purpose flour"},{"amount":"100","unit":"g","name":"unsalted butter"},{"amount":"4","unit":"","name":"egg"},{"amount":"150","unit":"g","name":"sugar"},{"amount":"120","unit":"ml","name":"lemon juice"},{"amount":"100","unit":"g","name":"unsalted butter"}]'::jsonb,
  '[{"order":1,"instruction":"Make pastry: rub butter into flour until breadcrumb texture. Add icing sugar and egg. Knead briefly. Rest 30 minutes. Blind bake at 180C, 20 minutes."},{"order":2,"instruction":"Whisk eggs, sugar, lemon juice, and zest together."},{"order":3,"instruction":"Cook over medium heat stirring constantly until thickened, about 10 minutes. Off heat, add cold butter in cubes, stir until glossy."},{"order":4,"instruction":"Pour curd into warm pastry shell. Refrigerate 3 hours until set."},{"order":5,"instruction":"Serve dusted with icing sugar."}]'::jsonb,
  true, ARRAY['French']
),

-- 39. Chicken Caesar Salad
(
  '00000000-0000-0000-0000-000000000039',
  '00000000-0000-0000-0000-0000000becee',
  'Chicken Caesar Salad',
  'Crisp romaine, house Caesar dressing with anchovy and Worcestershire, torn croutons.',
  'American', 'easy', 20, 15, 4,
  'https://image.pollinations.ai/prompt/overhead%20food%20photography%20chicken%20caesar%20salad%20croutons%20parmesan%20romaine?width=800&height=800&seed=1039&nologo=true',
  '{"salt":65,"sweet":10,"umami":80,"spice":20,"acid":55}'::jsonb,
  '[{"amount":"2","unit":"","name":"romaine lettuce"},{"amount":"400","unit":"g","name":"chicken breast"},{"amount":"4","unit":"","name":"anchovy"},{"amount":"1","unit":"tbsp","name":"dijon mustard"},{"amount":"50","unit":"g","name":"parmesan"},{"amount":"2","unit":"slices","name":"sourdough bread"}]'::jsonb,
  '[{"order":1,"instruction":"Make croutons: tear sourdough, toss with olive oil and salt. Bake 180C 12 minutes until golden and crunchy."},{"order":2,"instruction":"Grill chicken with salt and pepper until cooked through. Slice."},{"order":3,"instruction":"Blend anchovy, garlic, yolk, mustard, lemon juice, and Worcestershire to a paste. Whisk in olive oil to emulsify. Season."},{"order":4,"instruction":"Toss romaine with dressing until well coated. Add shaved Parmesan and croutons."},{"order":5,"instruction":"Top with sliced chicken. Serve immediately."}]'::jsonb,
  true, ARRAY['American']
),

-- 40. Bibimbap
(
  '00000000-0000-0000-0000-000000000040',
  '00000000-0000-0000-0000-0000000becee',
  'Bibimbap',
  'Warm rice topped with seasoned vegetables, a fried egg, and gochujang sauce — stir before eating.',
  'Korean', 'medium', 30, 25, 4,
  'https://image.pollinations.ai/prompt/overhead%20food%20photography%20bibimbap%20korean%20rice%20vegetables%20egg%20gochujang%20bowl?width=800&height=800&seed=1040&nologo=true',
  '{"salt":65,"sweet":40,"umami":80,"spice":65,"acid":35}'::jsonb,
  '[{"amount":"400","unit":"g","name":"white rice"},{"amount":"200","unit":"g","name":"spinach"},{"amount":"200","unit":"g","name":"mushroom"},{"amount":"4","unit":"","name":"egg"},{"amount":"3","unit":"tbsp","name":"gochujang"},{"amount":"1","unit":"tbsp","name":"sesame oil"}]'::jsonb,
  '[{"order":1,"instruction":"Cook rice. Blanch spinach, squeeze dry, season with sesame oil, soy sauce, and garlic."},{"order":2,"instruction":"Julienne carrots, stir-fry briefly with sesame oil. Saute mushrooms with soy sauce."},{"order":3,"instruction":"Mix gochujang, sugar, sesame oil, and rice vinegar into a sauce."},{"order":4,"instruction":"Fry eggs sunny side up."},{"order":5,"instruction":"Bowl rice, arrange each vegetable in sections. Place egg in center. Drizzle gochujang sauce. Mix everything together before eating."}]'::jsonb,
  true, ARRAY['Korean']
),
-- 41. Carbonara
(
  '00000000-0000-0000-0000-000000000041',
  '00000000-0000-0000-0000-0000000becee',
  'Spaghetti Carbonara',
  'Roman classic: guanciale, egg yolks, Pecorino, and black pepper — no cream ever.',
  'Italian', 'medium', 5, 20, 2,
  'https://image.pollinations.ai/prompt/overhead%20food%20photography%20spaghetti%20carbonara%20guanciale%20egg%20yolk%20pepper%20white%20bowl?width=800&height=800&seed=1041&nologo=true',
  '{"salt":70,"sweet":5,"umami":85,"spice":55,"acid":10}'::jsonb,
  '[{"amount":"200","unit":"g","name":"spaghetti"},{"amount":"100","unit":"g","name":"guanciale"},{"amount":"4","unit":"","name":"egg yolk"},{"amount":"50","unit":"g","name":"pecorino romano"},{"amount":"30","unit":"g","name":"parmesan"},{"amount":"2","unit":"tsp","name":"black pepper"}]'::jsonb,
  '[{"order":1,"instruction":"Cook guanciale in a dry pan over medium heat until fat renders and edges crisp. Remove from heat."},{"order":2,"instruction":"Whisk egg yolks with grated cheeses and cracked black pepper into a paste."},{"order":3,"instruction":"Cook spaghetti in heavily salted water 2 minutes short of al dente. Reserve 200ml pasta water."},{"order":4,"instruction":"Transfer pasta to guanciale pan off the heat. Add yolk mixture, tossing vigorously. Add pasta water a splash at a time until silky sauce coats each strand. Serve immediately."}]'::jsonb,
  true, ARRAY['Italian']
),

-- 42. Croissant French Toast
(
  '00000000-0000-0000-0000-000000000042',
  '00000000-0000-0000-0000-0000000becee',
  'Croissant French Toast',
  'Stale croissants soaked in vanilla custard and pan-fried to custardy gold perfection.',
  'French', 'easy', 10, 10, 2,
  'https://image.pollinations.ai/prompt/overhead%20food%20photography%20croissant%20french%20toast%20powdered%20sugar%20berries%20maple?width=800&height=800&seed=1042&nologo=true',
  '{"salt":25,"sweet":75,"umami":15,"spice":10,"acid":15}'::jsonb,
  '[{"amount":"4","unit":"","name":"day-old croissant"},{"amount":"3","unit":"","name":"egg"},{"amount":"150","unit":"ml","name":"whole milk"},{"amount":"2","unit":"tbsp","name":"heavy cream"},{"amount":"1","unit":"tsp","name":"vanilla extract"},{"amount":"2","unit":"tbsp","name":"unsalted butter"}]'::jsonb,
  '[{"order":1,"instruction":"Whisk eggs, milk, cream, sugar, vanilla, and cinnamon into a custard."},{"order":2,"instruction":"Halve croissants lengthways. Soak cut-side down in custard 2 minutes per side."},{"order":3,"instruction":"Melt butter in a non-stick skillet over medium. Cook croissants cut-side down 3 minutes until golden. Flip, 2 minutes more."},{"order":4,"instruction":"Serve immediately with powdered sugar and maple syrup."}]'::jsonb,
  true, ARRAY['French']
),

-- 43. Texas Chili
(
  '00000000-0000-0000-0000-000000000043',
  '00000000-0000-0000-0000-0000000becee',
  'Texas Chili con Carne',
  'Slow-cooked chuck with a blend of dried chilies, no beans — the way Texas intended.',
  'American', 'medium', 20, 120, 6,
  'https://image.pollinations.ai/prompt/overhead%20food%20photography%20texas%20chili%20con%20carne%20bowl%20sour%20cream%20cheddar?width=800&height=800&seed=1043&nologo=true',
  '{"salt":65,"sweet":20,"umami":80,"spice":80,"acid":35}'::jsonb,
  '[{"amount":"1.5","unit":"kg","name":"beef chuck"},{"amount":"4","unit":"","name":"dried ancho chili"},{"amount":"3","unit":"","name":"dried guajillo chili"},{"amount":"2","unit":"tsp","name":"cumin"},{"amount":"400","unit":"g","name":"canned crushed tomato"},{"amount":"300","unit":"ml","name":"beef stock"}]'::jsonb,
  '[{"order":1,"instruction":"Toast dried chilies in a dry skillet, soak 20 minutes in hot water. Blend to a smooth paste."},{"order":2,"instruction":"Cut chuck into 3cm cubes. Brown well in batches in a Dutch oven."},{"order":3,"instruction":"Soften onion and garlic. Add chili paste, cumin, and oregano, fry 2 minutes."},{"order":4,"instruction":"Add beef, tomatoes, and stock. Simmer uncovered 2 hours until beef is very tender and sauce has reduced."},{"order":5,"instruction":"Season. Serve with sour cream, shredded cheddar, and cornbread."}]'::jsonb,
  true, ARRAY['American']
),

-- 44. Har Gow
(
  '00000000-0000-0000-0000-000000000044',
  '00000000-0000-0000-0000-0000000becee',
  'Har Gow (Shrimp Dumplings)',
  'Translucent steamed shrimp dumplings with a delicate wheat-starch wrapper and bouncy filling.',
  'Chinese', 'hard', 60, 10, 4,
  'https://image.pollinations.ai/prompt/overhead%20food%20photography%20har%20gow%20shrimp%20dumplings%20bamboo%20steamer%20dim%20sum?width=800&height=800&seed=1044&nologo=true',
  '{"salt":60,"sweet":15,"umami":80,"spice":10,"acid":15}'::jsonb,
  '[{"amount":"200","unit":"g","name":"shrimp"},{"amount":"100","unit":"g","name":"bamboo shoot"},{"amount":"1","unit":"tbsp","name":"sesame oil"},{"amount":"180","unit":"g","name":"wheat starch"},{"amount":"60","unit":"g","name":"tapioca starch"},{"amount":"220","unit":"ml","name":"boiling water"}]'::jsonb,
  '[{"order":1,"instruction":"Mix wheat starch and tapioca starch. Pour in boiling water and stir quickly into a shaggy dough. Knead with oiled hands until smooth. Rest covered 5 minutes."},{"order":2,"instruction":"Coarsely chop shrimp and bamboo shoots. Mix with sesame oil, soy sauce, and cornstarch. Chill."},{"order":3,"instruction":"Roll tiny portions of dough thin on an oiled surface. Place a teaspoon of filling in center, pleat to seal."},{"order":4,"instruction":"Steam in a bamboo steamer over boiling water for 8-9 minutes until wrappers are translucent."}]'::jsonb,
  true, ARRAY['Chinese']
),

-- 45. Acai Bowl
(
  '00000000-0000-0000-0000-000000000045',
  '00000000-0000-0000-0000-0000000becee',
  'Acai Bowl',
  'Frozen acai blended thick as soft-serve, crowned with granola, banana, and honey.',
  'American', 'easy', 10, 0, 2,
  'https://image.pollinations.ai/prompt/overhead%20food%20photography%20acai%20bowl%20granola%20banana%20berries%20honey%20purple?width=800&height=800&seed=1045&nologo=true',
  '{"salt":10,"sweet":75,"umami":5,"spice":5,"acid":35}'::jsonb,
  '[{"amount":"200","unit":"g","name":"frozen acai puree"},{"amount":"100","unit":"g","name":"frozen blueberry"},{"amount":"1","unit":"","name":"banana"},{"amount":"100","unit":"ml","name":"almond milk"},{"amount":"80","unit":"g","name":"granola"},{"amount":"100","unit":"g","name":"strawberry"}]'::jsonb,
  '[{"order":1,"instruction":"Blend frozen acai, frozen blueberries, half the banana, and almond milk on high until thick and smooth — consistency of soft-serve."},{"order":2,"instruction":"Scoop into chilled bowls."},{"order":3,"instruction":"Top with granola, sliced banana, fresh strawberries, chia seeds, coconut flakes, and a drizzle of honey."}]'::jsonb,
  true, ARRAY['American']
),
-- 46. Pork Souvlaki
(
  '00000000-0000-0000-0000-000000000046',
  '00000000-0000-0000-0000-0000000becee',
  'Pork Souvlaki',
  'Lemon-oregano marinated pork skewers grilled over high heat, served in a warm pita with tzatziki.',
  'Mediterranean', 'easy', 20, 15, 4,
  'https://image.pollinations.ai/prompt/overhead%20food%20photography%20pork%20souvlaki%20skewers%20pita%20tzatziki%20lemon%20greek?width=800&height=800&seed=1046&nologo=true',
  '{"salt":60,"sweet":15,"umami":55,"spice":25,"acid":60}'::jsonb,
  '[{"amount":"700","unit":"g","name":"pork shoulder"},{"amount":"3","unit":"tbsp","name":"olive oil"},{"amount":"2","unit":"","name":"lemon"},{"amount":"1","unit":"tbsp","name":"dried oregano"},{"amount":"200","unit":"g","name":"greek yogurt"},{"amount":"4","unit":"","name":"pita bread"}]'::jsonb,
  '[{"order":1,"instruction":"Cube pork 3cm. Marinate with olive oil, lemon juice, oregano, garlic, and salt for 1 hour."},{"order":2,"instruction":"Thread onto skewers. Grill on high heat 3-4 minutes per side until charred."},{"order":3,"instruction":"Tzatziki: grate cucumber, squeeze dry. Mix with yogurt, garlic, lemon juice, olive oil, and mint. Season."},{"order":4,"instruction":"Warm pitas. Fill with souvlaki, sliced tomato, red onion, and a big spoonful of tzatziki."}]'::jsonb,
  true, ARRAY['Mediterranean']
),

-- 47. Shakshuka Verde
(
  '00000000-0000-0000-0000-000000000047',
  '00000000-0000-0000-0000-0000000becee',
  'Shakshuka Verde',
  'A green twist: eggs poached in a bright tomatillo-jalapeno sauce with cotija cheese.',
  'Mexican', 'easy', 10, 20, 3,
  'https://image.pollinations.ai/prompt/overhead%20food%20photography%20shakshuka%20verde%20green%20tomatillo%20eggs%20cotija%20cast%20iron?width=800&height=800&seed=1047&nologo=true',
  '{"salt":55,"sweet":20,"umami":60,"spice":65,"acid":70}'::jsonb,
  '[{"amount":"500","unit":"g","name":"tomatillo"},{"amount":"2","unit":"","name":"jalapeno"},{"amount":"1","unit":"","name":"onion"},{"amount":"100","unit":"g","name":"spinach"},{"amount":"6","unit":"","name":"egg"},{"amount":"80","unit":"g","name":"feta cheese"}]'::jsonb,
  '[{"order":1,"instruction":"Char tomatillos and jalapenos directly on the stovetop or under a broiler until blistered."},{"order":2,"instruction":"Blend with garlic and a pinch of salt into a rough sauce."},{"order":3,"instruction":"Soften onion in olive oil. Add blended sauce, simmer 8 minutes. Stir in spinach until wilted."},{"order":4,"instruction":"Make wells, crack in eggs, cover and cook 6-8 minutes. Top with crumbled feta, cilantro, and lime wedges."}]'::jsonb,
  true, ARRAY['Mexican']
),

-- 48. Hyderabadi Biryani
(
  '00000000-0000-0000-0000-000000000048',
  '00000000-0000-0000-0000-0000000becee',
  'Hyderabadi Chicken Biryani',
  'Fragrant dum-cooked basmati rice layered with spiced chicken, caramelized onion, and saffron.',
  'Indian', 'hard', 60, 60, 6,
  'https://image.pollinations.ai/prompt/overhead%20food%20photography%20chicken%20biryani%20saffron%20rice%20fried%20onion%20mint%20indian?width=800&height=800&seed=1048&nologo=true',
  '{"salt":65,"sweet":30,"umami":70,"spice":75,"acid":35}'::jsonb,
  '[{"amount":"800","unit":"g","name":"chicken thigh"},{"amount":"400","unit":"g","name":"basmati rice"},{"amount":"200","unit":"g","name":"plain yogurt"},{"amount":"3","unit":"tsp","name":"garam masala"},{"amount":"0.5","unit":"tsp","name":"saffron"},{"amount":"4","unit":"tbsp","name":"ghee"}]'::jsonb,
  '[{"order":1,"instruction":"Marinate chicken in yogurt, spices, ginger, garlic, salt for 2 hours."},{"order":2,"instruction":"Fry onions in ghee until deep caramel brown. Set half aside for garnish."},{"order":3,"instruction":"Par-cook rice in heavily spiced salted water until 70% done. Drain."},{"order":4,"instruction":"Layer in a heavy pot: chicken, half rice, fried onion, mint, saffron milk, remaining rice. Cover tightly. Dum cook on low heat 45 minutes."},{"order":5,"instruction":"Serve by scooping through all layers ensuring everyone gets both rice and chicken."}]'::jsonb,
  true, ARRAY['Indian']
),

-- 49. Mango Sticky Rice
(
  '00000000-0000-0000-0000-000000000049',
  '00000000-0000-0000-0000-0000000becee',
  'Mango Sticky Rice',
  'Warm glutinous rice soaked in coconut cream served with ripe sliced mango.',
  'Thai', 'easy', 10, 30, 4,
  'https://image.pollinations.ai/prompt/overhead%20food%20photography%20mango%20sticky%20rice%20coconut%20cream%20thai%20dessert?width=800&height=800&seed=1049&nologo=true',
  '{"salt":20,"sweet":85,"umami":10,"spice":5,"acid":25}'::jsonb,
  '[{"amount":"300","unit":"g","name":"glutinous rice"},{"amount":"400","unit":"ml","name":"canned coconut milk"},{"amount":"80","unit":"g","name":"sugar"},{"amount":"2","unit":"","name":"ripe mango"},{"amount":"1","unit":"","name":"pandan leaf"}]'::jsonb,
  '[{"order":1,"instruction":"Soak glutinous rice 4 hours. Steam over high heat with pandan leaf for 20 minutes until translucent and sticky."},{"order":2,"instruction":"Heat coconut milk, sugar, and salt until just dissolved. Reserve 4 tbsp. Pour rest over warm rice, stir gently, rest 20 minutes to absorb."},{"order":3,"instruction":"Peel and slice mango. Serve alongside a scoop of rice, drizzled with reserved coconut cream."}]'::jsonb,
  true, ARRAY['Thai']
),

-- 50. Classic Gruyere Souffle
(
  '00000000-0000-0000-0000-000000000050',
  '00000000-0000-0000-0000-0000000becee',
  'Classic Gruyere Souffle',
  'The ultimate test of a cook — a tall, trembling souffle with a molten, cheesy center.',
  'French', 'hard', 20, 18, 4,
  'https://image.pollinations.ai/prompt/overhead%20food%20photography%20gruyere%20souffle%20risen%20ramekin%20french%20cheese?width=800&height=800&seed=1050&nologo=true',
  '{"salt":65,"sweet":10,"umami":85,"spice":20,"acid":10}'::jsonb,
  '[{"amount":"30","unit":"g","name":"unsalted butter"},{"amount":"30","unit":"g","name":"all-purpose flour"},{"amount":"250","unit":"ml","name":"whole milk"},{"amount":"150","unit":"g","name":"gruyere cheese"},{"amount":"4","unit":"","name":"egg"},{"amount":"1","unit":"tsp","name":"dijon mustard"}]'::jsonb,
  '[{"order":1,"instruction":"Preheat oven to 200C. Butter 4 ramekins generously, coat with grated Parmesan."},{"order":2,"instruction":"Make bechamel: melt butter, add flour, cook 2 minutes. Whisk in warm milk until thick. Off heat, add Gruyere, mustard, cayenne, and egg yolks. Season."},{"order":3,"instruction":"Whisk egg whites with a pinch of salt to stiff peaks."},{"order":4,"instruction":"Fold one-third whites into base to loosen, then fold in remaining whites in two additions."},{"order":5,"instruction":"Fill ramekins to rim. Run your thumb around inside edge to create a top hat effect. Bake 12-15 minutes until risen and golden. Do not open the oven during baking. Serve immediately."}]'::jsonb,
  true, ARRAY['French']
)

on conflict (id) do nothing;
