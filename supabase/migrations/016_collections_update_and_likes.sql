-- 016: Add missing UPDATE policies for collections + recipe_likes table

-- ── UPDATE RLS policies for recipe_collections ──────────────────────

create policy "collections: owner update"
  on public.recipe_collections for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "collection_items: owner update"
  on public.recipe_collection_items for update
  using (
    exists (
      select 1 from public.recipe_collections c
      where c.id = collection_id and c.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.recipe_collections c
      where c.id = collection_id and c.user_id = auth.uid()
    )
  );

-- ── recipe_likes: public heart/like on a recipe ─────────────────────

create table if not exists public.recipe_likes (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  recipe_id  uuid not null references public.recipes(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, recipe_id)
);

create index if not exists idx_recipe_likes_recipe on public.recipe_likes(recipe_id);
create index if not exists idx_recipe_likes_user on public.recipe_likes(user_id);

alter table public.recipe_likes enable row level security;

create policy "likes: anyone can read"
  on public.recipe_likes for select
  using (true);

create policy "likes: user can insert own"
  on public.recipe_likes for insert
  with check (user_id = auth.uid());

create policy "likes: user can delete own"
  on public.recipe_likes for delete
  using (user_id = auth.uid());
