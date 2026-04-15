-- 013_rename_palate_axes.sql
-- Rename the 5 palate axes from cheffy salt/sweet/umami/spice/acid to
-- relatable sweet/spicy/savory/sour/bitter. Drops 'salt' (rarely meaningful)
-- and adds 'bitter' as a neutral-default new axis.
--
-- Mapping:
--   salt  -> dropped
--   sweet -> sweet  (same)
--   umami -> savory
--   spice -> spicy
--   acid  -> sour
--   --    -> bitter (default 50)
--
-- Safe to run once. Operates on existing profiles.palate_vector and
-- recipes.palate_vector jsonb columns. Non-destructive — coalesces
-- missing keys to 50 (neutral).

update profiles
set palate_vector = jsonb_build_object(
  'sweet',  coalesce((palate_vector->>'sweet')::int, 50),
  'spicy',  coalesce((palate_vector->>'spice')::int, 50),
  'savory', coalesce((palate_vector->>'umami')::int, 50),
  'sour',   coalesce((palate_vector->>'acid')::int,  50),
  'bitter', 50
)
where palate_vector is not null;

update recipes
set palate_vector = jsonb_build_object(
  'sweet',  coalesce((palate_vector->>'sweet')::int, 50),
  'spicy',  coalesce((palate_vector->>'spice')::int, 50),
  'savory', coalesce((palate_vector->>'umami')::int, 50),
  'sour',   coalesce((palate_vector->>'acid')::int,  50),
  'bitter', 50
)
where palate_vector is not null;
