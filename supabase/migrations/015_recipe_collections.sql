-- supabase/migrations/015_recipe_collections.sql

create table if not exists public.recipe_collections (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  name       text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.recipe_collection_items (
  collection_id uuid not null references public.recipe_collections(id) on delete cascade,
  recipe_id     uuid not null references public.recipes(id) on delete cascade,
  added_at      timestamptz not null default now(),
  primary key (collection_id, recipe_id)
);

create index if not exists idx_recipe_collection_items_collection on public.recipe_collection_items(collection_id);
create index if not exists idx_recipe_collection_items_recipe on public.recipe_collection_items(recipe_id);
create index if not exists idx_recipe_collections_user on public.recipe_collections(user_id);

-- RLS: recipe_collections — users can only see and modify their own
alter table public.recipe_collections enable row level security;

create policy "collections: owner read"
  on public.recipe_collections for select
  using (user_id = auth.uid());

create policy "collections: owner insert"
  on public.recipe_collections for insert
  with check (user_id = auth.uid());

create policy "collections: owner delete"
  on public.recipe_collections for delete
  using (user_id = auth.uid());

-- RLS: recipe_collection_items — users can read/write items only for their collections
alter table public.recipe_collection_items enable row level security;

create policy "collection_items: owner read"
  on public.recipe_collection_items for select
  using (
    exists (
      select 1 from public.recipe_collections c
      where c.id = collection_id and c.user_id = auth.uid()
    )
  );

create policy "collection_items: owner insert"
  on public.recipe_collection_items for insert
  with check (
    exists (
      select 1 from public.recipe_collections c
      where c.id = collection_id and c.user_id = auth.uid()
    )
  );

create policy "collection_items: owner delete"
  on public.recipe_collection_items for delete
  using (
    exists (
      select 1 from public.recipe_collections c
      where c.id = collection_id and c.user_id = auth.uid()
    )
  );
