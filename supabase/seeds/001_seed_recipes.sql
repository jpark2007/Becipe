-- Seed: 10 canonical recipes with palate vectors and pollinations.ai photos.
--
-- HOW TO APPLY: Run via the Supabase Dashboard SQL editor as service_role,
-- OR via `supabase db push` if running against a local Supabase. Direct
-- inserts into auth.users require service-role privileges.
--
-- Idempotent: ON CONFLICT DO NOTHING throughout. Safe to re-run.

-- pgcrypto provides crypt() + gen_salt() for the auth.users password hash.
create extension if not exists pgcrypto;

-- We need a seed user to attribute these recipes to. Create one if not
-- exists, using a deterministic UUID so the SQL is reproducible.
insert into auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data, aud, role
) values (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'seed-canon@dishr.app',
  crypt('seed-not-real', gen_salt('bf')),
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"username":"dishr","display_name":"Dishr"}'::jsonb,
  'authenticated', 'authenticated'
) on conflict (id) do nothing;

-- The auto-profile trigger from migration 002 creates the profile row.
-- If the trigger didn't fire (e.g. user already existed), defensively
-- ensure a profile row exists. Then mark as seed.
insert into profiles (id, username, display_name)
  values ('00000000-0000-0000-0000-000000000001', 'dishr', 'Dishr')
  on conflict (id) do nothing;
update profiles set is_seed = true where id = '00000000-0000-0000-0000-000000000001';

-- Recipes
insert into recipes (
  created_by, title, description,
  ingredients, steps, tips,
  cover_image_url, prep_time_minutes, cook_time_minutes,
  servings, difficulty, cuisine, tags, is_public,
  source_type, palate_vector
) values
(
  '00000000-0000-0000-0000-000000000001',
  'Charred Miso-Glazed Salmon',
  'Caramelized miso crust on king salmon with crispy herbs.',
  '[{"name":"King salmon fillet","amount":"280","unit":"g"},{"name":"White miso paste","amount":"2","unit":"tbsp"},{"name":"Mirin","amount":"1","unit":"tbsp"},{"name":"Fresh dill + chives","amount":"handful","unit":""},{"name":"Lemon","amount":"1","unit":""}]'::jsonb,
  '["Whisk miso, mirin, and a splash of soy into a glaze.","Pat salmon dry, brush all sides with glaze.","Sear skin-side down in a hot pan for 4 minutes without moving.","Flip, baste with remaining glaze, finish 2 minutes.","Top with herbs and a squeeze of lemon."]'::jsonb,
  '["Don''t move the salmon while searing — let the crust form.","If miso burns, your pan was too hot."]'::jsonb,
  'https://image.pollinations.ai/prompt/charred%20miso%20glazed%20salmon%20with%20crispy%20herbs%20overhead%20shot%20on%20ceramic%20plate%2C%20natural%20light%2C%20food%20photography?width=800&height=800&seed=101&nologo=true&model=flux',
  10, 15, 2, 'easy', 'japanese',
  ARRAY['seafood','umami','quick'],
  true, 'manual',
  '{"salt":78,"sweet":32,"umami":91,"spice":20,"acid":58}'::jsonb
),
(
  '00000000-0000-0000-0000-000000000001',
  'Heirloom Herb Roast Chicken',
  'Slow-roasted chicken with butter, garlic, and a forest of fresh herbs.',
  '[{"name":"Whole chicken","amount":"1.4","unit":"kg"},{"name":"Unsalted butter","amount":"60","unit":"g"},{"name":"Garlic","amount":"6","unit":"cloves"},{"name":"Thyme + rosemary + sage","amount":"large bunch","unit":""},{"name":"Lemon","amount":"1","unit":""}]'::jsonb,
  '["Pat chicken dry, salt all over, rest 30 min.","Soften butter with minced garlic and chopped herbs.","Loosen skin and rub butter underneath.","Stuff cavity with lemon and remaining herbs.","Roast at 220C / 425F for 60 min until juices run clear."]'::jsonb,
  '["Salt early — even 30 minutes makes a difference.","Rest 15 min before carving."]'::jsonb,
  'https://image.pollinations.ai/prompt/heirloom%20herb%20roast%20chicken%20golden%20brown%20on%20ceramic%20plate%20overhead%20shot%2C%20natural%20light%2C%20food%20photography?width=800&height=800&seed=102&nologo=true&model=flux',
  20, 60, 4, 'medium', 'french',
  ARRAY['poultry','herbal','sunday'],
  true, 'manual',
  '{"salt":68,"sweet":22,"umami":74,"spice":15,"acid":40}'::jsonb
),
(
  '00000000-0000-0000-0000-000000000001',
  'Smoked Paprika Carrots with Feta',
  'Sweet roasted carrots, smoky paprika, salty feta, bright herbs.',
  '[{"name":"Heirloom carrots","amount":"500","unit":"g"},{"name":"Olive oil","amount":"3","unit":"tbsp"},{"name":"Smoked paprika","amount":"2","unit":"tsp"},{"name":"Feta","amount":"100","unit":"g"},{"name":"Mint + parsley","amount":"handful","unit":""}]'::jsonb,
  '["Halve carrots lengthwise, toss with oil, paprika, salt.","Roast at 200C / 400F for 25 min until charred at edges.","Crumble feta over warm carrots.","Shower with herbs and a drizzle of oil."]'::jsonb,
  '["Use multi-color carrots — they look incredible.","Char is flavor; don''t pull them too early."]'::jsonb,
  'https://image.pollinations.ai/prompt/roasted%20smoked%20paprika%20carrots%20with%20feta%20cheese%20and%20fresh%20herbs%20overhead%20on%20ceramic%20plate%2C%20natural%20light?width=800&height=800&seed=103&nologo=true&model=flux',
  10, 25, 4, 'easy', 'mediterranean',
  ARRAY['vegetable','side','smoky'],
  true, 'manual',
  '{"salt":62,"sweet":58,"umami":40,"spice":35,"acid":48}'::jsonb
),
(
  '00000000-0000-0000-0000-000000000001',
  'Kritharaki Harvest Bowl',
  'Greek orzo with roasted vegetables, lemon, and crumbled cheese.',
  '[{"name":"Kritharaki / orzo","amount":"300","unit":"g"},{"name":"Mixed roasted vegetables","amount":"400","unit":"g"},{"name":"Lemon","amount":"1","unit":""},{"name":"Olive oil","amount":"4","unit":"tbsp"},{"name":"Fresh dill","amount":"handful","unit":""}]'::jsonb,
  '["Cook orzo in salted boiling water until al dente.","Toss with roasted vegetables, lemon zest, and oil.","Finish with dill and crumbled feta if you have it."]'::jsonb,
  '["Cook the orzo a minute under — it keeps cooking from residual heat."]'::jsonb,
  'https://image.pollinations.ai/prompt/greek%20orzo%20harvest%20bowl%20with%20roasted%20vegetables%20lemon%20overhead%20on%20ceramic%20plate%2C%20natural%20light%2C%20food%20photography?width=800&height=800&seed=104&nologo=true&model=flux',
  10, 20, 4, 'easy', 'greek',
  ARRAY['grain','bowl','weeknight'],
  true, 'manual',
  '{"salt":55,"sweet":35,"umami":62,"spice":18,"acid":68}'::jsonb
),
(
  '00000000-0000-0000-0000-000000000001',
  'Charred Brassica Plate',
  'Burnt-edge broccoli, kale, and cabbage with garlic crumbs.',
  '[{"name":"Tenderstem broccoli","amount":"300","unit":"g"},{"name":"Cavolo nero","amount":"200","unit":"g"},{"name":"Sourdough crumbs","amount":"60","unit":"g"},{"name":"Garlic","amount":"3","unit":"cloves"},{"name":"Chili flakes","amount":"1","unit":"tsp"}]'::jsonb,
  '["Get a cast iron pan smoking hot.","Char broccoli and kale in batches without crowding — 3 min per side.","Toast crumbs with garlic and oil until deep gold.","Pile vegetables on a plate, scatter crumbs, finish with chili and oil."]'::jsonb,
  '["Smoke is the goal — open a window.","Don''t stir constantly. Char needs contact time."]'::jsonb,
  'https://image.pollinations.ai/prompt/charred%20broccoli%20and%20kale%20with%20garlic%20crumbs%20on%20dark%20ceramic%20plate%20overhead%2C%20natural%20light?width=800&height=800&seed=105&nologo=true&model=flux',
  10, 15, 2, 'easy', 'italian',
  ARRAY['vegetable','smoky','quick'],
  true, 'manual',
  '{"salt":70,"sweet":18,"umami":52,"spice":50,"acid":30}'::jsonb
),
(
  '00000000-0000-0000-0000-000000000001',
  'Lemony Spring Pea Pasta',
  'Bright peas, pecorino, lemon, and lots of butter on tagliatelle.',
  '[{"name":"Tagliatelle","amount":"300","unit":"g"},{"name":"Fresh peas","amount":"200","unit":"g"},{"name":"Pecorino","amount":"60","unit":"g"},{"name":"Lemon","amount":"1","unit":""},{"name":"Butter","amount":"50","unit":"g"}]'::jsonb,
  '["Boil pasta in heavily salted water.","Melt butter in a pan, add peas, warm through.","Drain pasta, toss in pan with butter, peas, lemon zest, and pecorino.","Finish with lemon juice and a splash of pasta water."]'::jsonb,
  '["Save pasta water — it''s your sauce."]'::jsonb,
  'https://image.pollinations.ai/prompt/lemon%20pea%20pasta%20with%20pecorino%20cheese%20overhead%20on%20ceramic%20plate%2C%20natural%20light%2C%20food%20photography?width=800&height=800&seed=106&nologo=true&model=flux',
  5, 12, 2, 'easy', 'italian',
  ARRAY['pasta','spring','bright'],
  true, 'manual',
  '{"salt":65,"sweet":42,"umami":68,"spice":12,"acid":72}'::jsonb
),
(
  '00000000-0000-0000-0000-000000000001',
  'Crispy Pork Larb',
  'Northern Thai pork with toasted rice powder, lime, chili, and herbs.',
  '[{"name":"Ground pork","amount":"400","unit":"g"},{"name":"Jasmine rice","amount":"3","unit":"tbsp"},{"name":"Lime","amount":"3","unit":""},{"name":"Fish sauce","amount":"3","unit":"tbsp"},{"name":"Mint + cilantro + Thai basil","amount":"large bunch","unit":""},{"name":"Bird''s eye chili","amount":"3","unit":""}]'::jsonb,
  '["Toast rice in dry pan until deep gold, blitz to powder.","Brown pork until crispy edges form.","Off heat: stir in fish sauce, lime juice, sliced chili, rice powder.","Toss with torn herbs and shallots. Serve with sticky rice."]'::jsonb,
  '["Toast the rice well — it''s what makes larb feel like larb."]'::jsonb,
  'https://image.pollinations.ai/prompt/thai%20pork%20larb%20with%20herbs%20chilies%20toasted%20rice%20overhead%20on%20ceramic%20plate%2C%20natural%20light%2C%20food%20photography?width=800&height=800&seed=107&nologo=true&model=flux',
  10, 15, 2, 'easy', 'thai',
  ARRAY['pork','spicy','herby'],
  true, 'manual',
  '{"salt":82,"sweet":20,"umami":75,"spice":85,"acid":80}'::jsonb
),
(
  '00000000-0000-0000-0000-000000000001',
  'Brown Butter Mushroom Toast',
  'Earthy mushrooms in nutty brown butter on grilled sourdough.',
  '[{"name":"Mixed mushrooms","amount":"400","unit":"g"},{"name":"Butter","amount":"80","unit":"g"},{"name":"Sourdough","amount":"4","unit":"slices"},{"name":"Garlic","amount":"2","unit":"cloves"},{"name":"Thyme","amount":"few sprigs","unit":""}]'::jsonb,
  '["Tear mushrooms into bite pieces.","Brown butter in a pan until nutty and dark gold.","Add mushrooms, don''t stir for 2 minutes — let them sear.","Toss in garlic and thyme, season heavily.","Pile on grilled sourdough, drizzle with pan butter."]'::jsonb,
  '["Tear, don''t slice — torn edges crisp better.","Pan needs to be hot enough that mushrooms sizzle on contact."]'::jsonb,
  'https://image.pollinations.ai/prompt/brown%20butter%20wild%20mushroom%20toast%20on%20sourdough%20overhead%20on%20ceramic%20plate%2C%20natural%20light%2C%20food%20photography?width=800&height=800&seed=108&nologo=true&model=flux',
  10, 15, 2, 'easy', 'french',
  ARRAY['mushroom','toast','umami'],
  true, 'manual',
  '{"salt":68,"sweet":24,"umami":92,"spice":12,"acid":18}'::jsonb
),
(
  '00000000-0000-0000-0000-000000000001',
  'Saffron Chicken Couscous',
  'Saffron-stained couscous with braised chicken, almonds, and dried fruit.',
  '[{"name":"Chicken thighs","amount":"6","unit":""},{"name":"Couscous","amount":"300","unit":"g"},{"name":"Saffron","amount":"large pinch","unit":""},{"name":"Toasted almonds","amount":"50","unit":"g"},{"name":"Dried apricots","amount":"60","unit":"g"},{"name":"Cinnamon","amount":"1","unit":"tsp"}]'::jsonb,
  '["Brown chicken thighs in a wide pan.","Add cinnamon, saffron, and stock to half-cover.","Braise covered for 40 min until fall-apart tender.","Steam couscous over the braise.","Top with shredded chicken, almonds, apricots, and herbs."]'::jsonb,
  '["Bloom saffron in warm water for 5 min before adding."]'::jsonb,
  'https://image.pollinations.ai/prompt/saffron%20chicken%20couscous%20with%20almonds%20and%20apricots%20overhead%20on%20ceramic%20plate%2C%20natural%20light%2C%20food%20photography?width=800&height=800&seed=109&nologo=true&model=flux',
  15, 50, 4, 'medium', 'moroccan',
  ARRAY['chicken','grain','warm-spice'],
  true, 'manual',
  '{"salt":58,"sweet":48,"umami":72,"spice":42,"acid":28}'::jsonb
),
(
  '00000000-0000-0000-0000-000000000001',
  'Tahini Chocolate Chunk Cookies',
  'Nutty tahini cookies with dark chocolate puddles and flaky salt.',
  '[{"name":"Tahini","amount":"180","unit":"g"},{"name":"Brown sugar","amount":"180","unit":"g"},{"name":"Egg","amount":"1","unit":""},{"name":"Dark chocolate","amount":"200","unit":"g"},{"name":"Plain flour","amount":"180","unit":"g"},{"name":"Flaky salt","amount":"to finish","unit":""}]'::jsonb,
  '["Whisk tahini, sugar, and egg until smooth.","Fold in flour, baking soda, and chopped chocolate.","Chill dough 30 min.","Scoop onto trays, bake at 180C / 350F for 11 min.","Top with flaky salt while warm."]'::jsonb,
  '["Tahini quality matters — runny and fresh, not paste-like."]'::jsonb,
  'https://image.pollinations.ai/prompt/tahini%20chocolate%20chunk%20cookies%20with%20flaky%20salt%20overhead%20on%20ceramic%20plate%2C%20natural%20light%2C%20food%20photography?width=800&height=800&seed=110&nologo=true&model=flux',
  15, 11, 12, 'easy', 'middle-eastern',
  ARRAY['dessert','cookie','tahini'],
  true, 'manual',
  '{"salt":52,"sweet":88,"umami":30,"spice":8,"acid":12}'::jsonb
)
on conflict do nothing;
