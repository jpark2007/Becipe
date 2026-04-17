-- supabase/migrations/006_palate_vector.sql
-- Adds palate vectors to profiles and recipes.
-- A palate vector is a JSON object with 5 numeric axes (0-100):
--   { salt, sweet, umami, spice, acid }
-- NULL means "not yet set" (e.g., user hasn't done the quiz).

alter table profiles
  add column if not exists palate_vector jsonb;

alter table recipes
  add column if not exists palate_vector jsonb;

-- One-time bypass for existing accounts: backfill a neutral palate so
-- existing users don't get force-routed through onboarding on next launch.
-- New accounts (created after this migration) still get NULL via the
-- auto-profile trigger and will be sent through the quiz.
update profiles
   set palate_vector = '{"salt":50,"sweet":50,"umami":50,"spice":50,"acid":50}'::jsonb
 where palate_vector is null;

comment on column profiles.palate_vector is
  '5-axis taste profile { salt, sweet, umami, spice, acid }, each 0-100. Set during onboarding quiz.';

comment on column recipes.palate_vector is
  '5-axis taste profile { salt, sweet, umami, spice, acid }, each 0-100. Used to compute match score against user palate.';
