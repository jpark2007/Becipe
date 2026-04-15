# Plan 4 — Ask Julian (AI Recipe Assistant)

**Date:** 2026-04-15
**Branch:** `ak-ui-v2` or a new branch
**Run in:** a new chat. New feature. Requires Supabase access (for rate-limit table + edge function) and an LLM API key.

## Context

Drew wants an in-recipe AI assistant that users can ask about substitutions, technique, dietary adjustments, baking math, and ingredient questions. Persona name is **Julian** — matches one of the seed user names and gives the AI a friendly face instead of "the assistant."

**Wedge:** most recipe apps just show recipes. Adding a "tap to ask about this recipe" button is a small addition that becomes a huge trust-building moment (*"I don't have butter, can I use oil?"* → instant answer in-context). Pairs especially well with baking (Plan 5), where substitution math matters.

## Scope

- Inline AI assistant on recipe detail pages
- Recipe context passed automatically (no user re-typing)
- Cost-controlled: rate-limited per user
- Low cost (GPT-4o-mini via OpenRouter, ~$0.00003 per query)
- Persona: friendly cook named Julian, short answers unless asked for detail
- Baking-aware: when recipe is baking, Julian applies weight-based substitution math
- Edge function handles the API call server-side (API key never ships to client)

## Out of scope

- Julian as a standalone chat destination outside of recipes (future)
- Julian voice mode (future — depends on Plan 3)
- Julian generating new recipes from scratch (future)
- Streaming responses (nice-to-have; v1 ships full responses at once)
- Memory / conversation history (v1 is stateless per-question)

---

## UX

### Entry point

On `app/recipe/[id]/index.tsx`, add a floating button: **"Ask Julian →"** with a small chat icon.

**Position:** pinned to the bottom-right of the recipe detail screen, just above the bottom safe area. Floating over the scroll content.

**Visual:**
- Rounded pill, ~52pt tall, clay background with cream text
- Small chat-bubble icon or waveform icon (whatever matches the design language)
- Subtle shadow, always visible

**Tap action:** opens `/ask-julian?recipeId=<id>` as a formSheet modal.

### Julian sheet

**File:** `app/ask-julian.tsx` (root-level, `presentation: 'formSheet'`)

**Layout, top to bottom:**

1. **Header** — "Ask Julian" + recipe title ("about Classic Cacio e Pepe") + × close button
2. **Quick-start suggestion pills** (horizontal scroll, optional):
   - "What can I substitute for [ingredient]?"
   - "How do I scale this to 6 servings?"
   - "Can I make this gluten-free?"
   - "Tips for first-time cooks?"
   Tapping a pill fills the input with that text.
3. **Conversation area** — scrolling list of user-question + julian-response bubbles
4. **Input area** — text input + send button
5. **Rate limit indicator** (subtle) — "8 of 10 questions today" in muted text below the input

### Interaction

1. User types or taps a pill → hits send
2. Input clears, user message appears in conversation
3. Loading dots appear below
4. Julian response streams in (or lands all at once in v1)
5. User can ask a follow-up
6. Stateless: each question is sent with just the recipe context, not the conversation history (keeps prompts cheap). Upgrade to conversation memory later if needed.

### Empty state

"Ask anything about this recipe. I can help with substitutions, techniques, scaling, dietary swaps, and more."

Suggested pills shown here too.

### Rate limit hit

"You've asked 10 questions today. Come back tomorrow or upgrade to unlimited." (Upgrade copy is aspirational — no billing yet.)

---

## Backend

### Migration 011 — ai_usage table

**File:** `supabase/migrations/011_ai_usage.sql`

```sql
create table if not exists ai_usage (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references profiles(id) on delete cascade,
  feature       text not null,  -- 'ask_julian' for now; future: 'recipe_gen', 'voice_transcribe'
  recipe_id     uuid references recipes(id) on delete set null,
  question      text not null,
  answer        text,
  tokens_in     int,
  tokens_out    int,
  cost_usd      numeric(10, 6),
  created_at    timestamptz default now() not null
);

alter table ai_usage enable row level security;

create policy "users read own ai usage"
  on ai_usage for select
  using (user_id = auth.uid());

create policy "users insert own ai usage"
  on ai_usage for insert
  with check (user_id = auth.uid());

-- Index for rate-limit lookups
create index ai_usage_user_date_idx on ai_usage(user_id, created_at);
```

### Edge function — `ask-julian`

**File:** `supabase/functions/ask-julian/index.ts`

**Deno runtime.** API key stored in Supabase secrets via `npx supabase secrets set OPENROUTER_API_KEY=sk-...` (or use `ANTHROPIC_API_KEY` if preferring Claude Haiku).

**Flow:**

1. Read auth context from request (Supabase auth header)
2. Read `{ recipeId, question }` from request body
3. Query `ai_usage` for this user's row count in the last 24h; if ≥ 10, return 429
4. Fetch the recipe from `recipes` table (need: title, description, ingredients, steps, tips, cuisine, difficulty, servings, palate_vector)
5. Build the prompt:
   ```
   System: You are Julian, a friendly and knowledgeable cook assistant inside the Becipe recipe app. Answer questions about the recipe the user is currently viewing. Be warm, direct, and concise — 2 to 4 sentences unless the user asks for detail. Offer practical substitutions with ratios when relevant. If the recipe is baking (has flour, butter, eggs, yeast, baking powder/soda), default to weight-based measurements for substitutions. Never invent ingredients not in the user's question. If you don't know, say so.

   Recipe context: {JSON of recipe fields}

   User question: {question}
   ```
6. Call OpenRouter `openai/gpt-4o-mini` (or Anthropic `claude-haiku-4-5`) with the prompt
7. Extract answer text and token counts
8. Insert into `ai_usage` with the question, answer, and token data
9. Return `{ answer, tokensUsed, remaining }` to the client

**Model choice:**
- `openai/gpt-4o-mini` via OpenRouter: ~$0.15 per 1M input, $0.60 per 1M output. Avg recipe context ~800 tokens, avg answer ~150 tokens → ~$0.00014 per query. Dirt cheap.
- Alternative: `anthropic/claude-haiku-4-5`: similar price, arguably better instruction-following
- Implementer picks; both via OpenRouter so the abstraction is the same

**Timeout:** 15 seconds. Fail gracefully if LLM doesn't respond in time.

**Input validation:**
- `question` length ≤ 500 chars (prevent prompt injection abuse)
- Strip control characters
- Reject if user is blocked or banned (stub — no banning yet)

### Client-side

**New file:** `lib/ask-julian.ts`

```ts
export async function askJulian(recipeId: string, question: string): Promise<{
  answer: string;
  tokensUsed: number;
  remaining: number;
}> {
  const { data, error } = await supabase.functions.invoke('ask-julian', {
    body: { recipeId, question },
  });
  if (error) throw error;
  return data;
}
```

**File:** `app/ask-julian.tsx` — full sheet UI

- Read `recipeId` from query params
- React-query mutation wraps `askJulian`
- Local state for conversation array (stateless per-question on backend, but we display a running list client-side for the current session)
- Rate limit indicator queries `ai_usage` count for today, updates after each send

### Register route

`app/_layout.tsx` root Stack:
```tsx
<Stack.Screen name="ask-julian" options={{ presentation: 'formSheet', headerShown: false }} />
```

---

## Baking detection

**Heuristic in edge function:**

```ts
const bakingIngredients = ['flour', 'butter', 'sugar', 'egg', 'yeast', 'baking powder', 'baking soda', 'cornstarch', 'cocoa'];
const recipeText = (recipe.ingredients.map(i => i.name).join(' ') + ' ' + recipe.difficulty).toLowerCase();
const isBaking = bakingIngredients.filter(ing => recipeText.includes(ing)).length >= 2
  || (recipe.difficulty === 'hard' && recipeText.includes('flour'));
```

If `isBaking`, append to system prompt:
> "This recipe involves baking. For any substitutions, prefer weight-based measurements (grams) over volume, and explain why the ratio matters."

Simple, rule-based, zero LLM calls to decide.

---

## Task list

### Migrations

- [ ] Write `supabase/migrations/011_ai_usage.sql`
- [ ] Drew runs it in Supabase SQL editor

### Edge function

- [ ] `supabase/functions/ask-julian/index.ts` — Deno function with rate limit + LLM call + usage tracking
- [ ] Drew sets `OPENROUTER_API_KEY` (or `ANTHROPIC_API_KEY`) in Supabase secrets
- [ ] Drew deploys via `npx supabase functions deploy ask-julian`

### Client

- [ ] `lib/ask-julian.ts` — client wrapper for the edge function
- [ ] `app/ask-julian.tsx` — full sheet UI (header, pills, conversation, input, rate limit)
- [ ] `app/_layout.tsx` — register `ask-julian` as a root-level formSheet route
- [ ] `app/recipe/[id]/index.tsx` — add floating "Ask Julian →" button pinned bottom-right

### Polish

- [ ] Quick-start suggestion pills (4–5 common questions)
- [ ] Loading states, error states, rate-limit-hit state
- [ ] Rate limit indicator below input
- [ ] Strip/sanitize user input

---

## Testing (Drew walks this)

1. Open any recipe → tap "Ask Julian →"
2. Sheet slides up showing recipe title and suggestion pills
3. Tap a suggestion pill → input fills → tap send
4. Loading dots, then Julian response appears in conversation
5. Ask a follow-up (stateless — doesn't remember the first question, but that's OK for v1)
6. Baking recipe: substitution answer prefers grams
7. Non-baking recipe: substitution answer uses volume or casual terms
8. Ask 10 questions in a row: 11th is blocked with rate-limit copy
9. Kill and relaunch: usage count persists (Supabase backed)
10. Slow response / timeout: error message is graceful, not a crash

## Done =

- Migration 011 applied to Drew's Supabase
- Edge function deployed with API key set
- Floating button on recipe detail opens the sheet
- Ask/answer loop works with real LLM calls
- Rate limit enforced server-side, displayed client-side
- Baking detection affects the system prompt for baking recipes
- tsc baseline held

## Cost notes

- ~$0.0001–$0.0003 per question (GPT-4o-mini or Haiku)
- 10 questions/day × 1000 daily active users = ~$1–$3/day = $30–$90/month at launch scale
- Well within "low cost" territory
- Rate limit protects against runaway cost if a user goes wild
- Future: tier the limit (free: 10/day, paid: unlimited) as a monetization vector

## Future expansions

- Streaming responses (better UX on slow answers)
- Conversation memory (pass recent Q/A back as context)
- Julian voice mode (TTS the answer, input via STT from Plan 3)
- Julian as standalone chat (ask general cooking questions outside of a recipe)
- Recipe generation ("make me a 30-min weeknight dinner with chicken and rice")
- Dietary profile awareness (allergies, vegan, etc. — requires a `user_preferences` table)
