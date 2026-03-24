-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────────────────────
-- PROFILES
-- ─────────────────────────────────────────────────────────────
create table if not exists profiles (
  id          uuid primary key references auth.users on delete cascade,
  username    text unique not null,
  display_name text not null,
  avatar_url  text,
  bio         text,
  created_at  timestamptz default now() not null
);

alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone"
  on profiles for select using (true);

create policy "Users can insert own profile"
  on profiles for insert with check (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

-- ─────────────────────────────────────────────────────────────
-- RECIPES
-- ─────────────────────────────────────────────────────────────
create table if not exists recipes (
  id              uuid primary key default gen_random_uuid(),
  created_by      uuid not null references profiles on delete cascade,
  title           text not null,
  description     text,
  source_url      text,
  source_name     text,
  source_credit   text,
  source_type     text not null default 'manual' check (source_type in ('manual','url','tiktok','instagram')),
  ingredients     jsonb not null default '[]',
  steps           jsonb not null default '[]',
  tips            jsonb not null default '[]',
  cover_image_url text,
  video_url       text,
  prep_time_min   int,
  cook_time_min   int,
  servings        int,
  difficulty      text check (difficulty in ('easy','medium','hard')),
  cuisine         text,
  tags            text[] not null default '{}',
  is_public       boolean not null default true,
  created_at      timestamptz default now() not null
);

alter table recipes enable row level security;

create policy "Public recipes viewable by all"
  on recipes for select using (is_public = true or auth.uid() = created_by);

create policy "Users can insert own recipes"
  on recipes for insert with check (auth.uid() = created_by);

create policy "Users can update own recipes"
  on recipes for update using (auth.uid() = created_by);

create policy "Users can delete own recipes"
  on recipes for delete using (auth.uid() = created_by);

-- Full text search index
create index recipes_title_fts on recipes using gin(to_tsvector('english', title));

-- ─────────────────────────────────────────────────────────────
-- RECIPE INGREDIENTS FLAT (for ingredient search)
-- ─────────────────────────────────────────────────────────────
create table if not exists recipe_ingredients_flat (
  recipe_id       uuid not null references recipes on delete cascade,
  ingredient_name text not null,
  primary key (recipe_id, ingredient_name)
);

alter table recipe_ingredients_flat enable row level security;

create policy "Ingredient search is public"
  on recipe_ingredients_flat for select using (true);

-- Auto-populate from recipes.ingredients on insert/update
create or replace function sync_recipe_ingredients()
returns trigger language plpgsql security definer as $$
declare
  ing jsonb;
begin
  delete from recipe_ingredients_flat where recipe_id = NEW.id;
  for ing in select * from jsonb_array_elements(NEW.ingredients) loop
    insert into recipe_ingredients_flat (recipe_id, ingredient_name)
    values (NEW.id, lower(ing->>'name'))
    on conflict do nothing;
  end loop;
  return NEW;
end;
$$;

create trigger sync_ingredients_after_upsert
  after insert or update of ingredients on recipes
  for each row execute function sync_recipe_ingredients();

-- ─────────────────────────────────────────────────────────────
-- FOLLOWS
-- ─────────────────────────────────────────────────────────────
create table if not exists follows (
  follower_id  uuid not null references profiles on delete cascade,
  following_id uuid not null references profiles on delete cascade,
  created_at   timestamptz default now() not null,
  primary key (follower_id, following_id)
);

alter table follows enable row level security;

create policy "Follows are viewable by all"
  on follows for select using (true);

create policy "Users can follow others"
  on follows for insert with check (auth.uid() = follower_id);

create policy "Users can unfollow"
  on follows for delete using (auth.uid() = follower_id);

-- ─────────────────────────────────────────────────────────────
-- FEED ITEMS
-- ─────────────────────────────────────────────────────────────
create table if not exists feed_items (
  id         uuid primary key default gen_random_uuid(),
  actor_id   uuid not null references profiles on delete cascade,
  verb       text not null check (verb in ('tried','saved','created')),
  recipe_id  uuid not null references recipes on delete cascade,
  try_id     uuid,
  created_at timestamptz default now() not null
);

alter table feed_items enable row level security;

create policy "Feed items viewable by actor or followers"
  on feed_items for select using (
    auth.uid() = actor_id or
    exists (
      select 1 from follows
      where follower_id = auth.uid() and following_id = actor_id
    )
  );

create policy "System inserts feed items"
  on feed_items for insert with check (true);

-- ─────────────────────────────────────────────────────────────
-- RECIPE TRIES
-- ─────────────────────────────────────────────────────────────
create table if not exists recipe_tries (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles on delete cascade,
  recipe_id  uuid not null references recipes on delete cascade,
  rating     numeric(3,1) not null check (rating >= 0 and rating <= 10),
  note       text,
  photo_url  text,
  tried_at   timestamptz default now() not null,
  created_at timestamptz default now() not null
);

alter table recipe_tries enable row level security;

create policy "Tries are viewable by all"
  on recipe_tries for select using (true);

create policy "Users can insert own tries"
  on recipe_tries for insert with check (auth.uid() = user_id);

create policy "Users can update own tries"
  on recipe_tries for update using (auth.uid() = user_id);

-- Trigger: auto-post to feed when a try is created
create or replace function on_try_created()
returns trigger language plpgsql security definer as $$
begin
  insert into feed_items (actor_id, verb, recipe_id, try_id)
  values (NEW.user_id, 'tried', NEW.recipe_id, NEW.id);
  return NEW;
end;
$$;

create trigger feed_on_try
  after insert on recipe_tries
  for each row execute function on_try_created();

-- ─────────────────────────────────────────────────────────────
-- SAVED RECIPES
-- ─────────────────────────────────────────────────────────────
create table if not exists saved_recipes (
  user_id    uuid not null references profiles on delete cascade,
  recipe_id  uuid not null references recipes on delete cascade,
  saved_at   timestamptz default now() not null,
  primary key (user_id, recipe_id)
);

alter table saved_recipes enable row level security;

create policy "Users can view own saves"
  on saved_recipes for select using (auth.uid() = user_id);

create policy "Users can save recipes"
  on saved_recipes for insert with check (auth.uid() = user_id);

create policy "Users can unsave recipes"
  on saved_recipes for delete using (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- COMMENTS
-- ─────────────────────────────────────────────────────────────
create table if not exists comments (
  id         uuid primary key default gen_random_uuid(),
  try_id     uuid not null references recipe_tries on delete cascade,
  user_id    uuid not null references profiles on delete cascade,
  body       text not null,
  created_at timestamptz default now() not null
);

alter table comments enable row level security;

create policy "Comments viewable by all"
  on comments for select using (true);

create policy "Users can post comments"
  on comments for insert with check (auth.uid() = user_id);

create policy "Users can delete own comments"
  on comments for delete using (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- ENABLE REALTIME
-- ─────────────────────────────────────────────────────────────
alter publication supabase_realtime add table feed_items;
alter publication supabase_realtime add table recipe_tries;
alter publication supabase_realtime add table comments;
