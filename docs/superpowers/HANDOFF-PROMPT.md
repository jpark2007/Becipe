# Handoff prompt for a fresh Claude chat

Copy-paste everything below the `---` into a new Claude Code session. It's self-contained.

---

You're picking up implementation work on the **Becipe** app (formerly Dishr — social recipe sharing, React Native / Expo / TypeScript / Supabase). I'm Drew (drewkhalil3). You have zero session context from my previous work; everything you need is in this prompt and the plan docs I'll point you at.

## Project basics

- **Repo:** `/Users/drewkhalil/Documents/Becipe`
- **Branch:** `ak-ui-v2` — local only. Do NOT push, do NOT merge to main, do NOT rebase.
- **Tech:** Expo SDK 55+ · expo-router (file-based routing) · TypeScript · Supabase (Postgres + Auth + Realtime + Storage + Edge Functions) · React Query v5 · Zustand · `react-native-safe-area-context`
- **Design system:** tokens live in `lib/theme.ts` — sage/clay/ochre on near-white bone base. NEVER hardcode hex. Use `colors.*`, `radius.*`, `shadow.*`. Inter font family (400–900). Full docs in `CLAUDE.md` at the repo root — read it first.

## Hard rules (non-negotiable)

1. **FREE TO HOST.** The only paid service allowed is the Apple Developer Program ($99/yr). No paid APIs, no paid AI, no paid STT, no paid image generation, no paid image hosting, no paid CDN. If a plan references a paid service, skip that feature and flag it in your report.
2. **No AI / LLM calls of any kind.** No OpenAI, Anthropic, OpenRouter, Cohere, Google Gemini, or any hosted LLM. Apple on-device frameworks (Speech, Foundation Models) are OK if they're free and shipped with iOS. Everything else is forbidden until monetization lands.
3. **Stay on `ak-ui-v2`.** Do not create new branches unless a plan explicitly tells you to. Do not push. Do not merge.
4. **One commit per task bullet.** Conventional commit messages: `feat(scope): subject`, `fix(scope): subject`, etc. End every commit message with:
   ```
   Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
   ```
5. **Tsc discipline.** Run `npx tsc --noEmit 2>&1 | wc -l` before you start each plan, record the number, and at the end your count must be **≤** the starting number. Pre-existing noise (Deno edge-function imports, `App/` vs `app/` casing, stale `scripts/seed/run.ts`) is NOT yours to fix.
6. **No schema changes** except migrations explicitly called out in a plan. Drew runs migrations in the Supabase dashboard — you just write the SQL file.
7. **No new dependencies** unless a plan explicitly approves it. If a plan says "verify X is installed" and it isn't, either use a workaround or flag it and stop.
8. **Delete do not rename.** When a plan says delete a file, delete it. Don't leave dead code behind.

## Where things stand

Previous work on this branch:
- **22 commits** (`aa1f0a91`..`c7102f51`) shipped the v2 redesign: 4-tab IA (Home/Explore/+/Kitchen/You), modal add sheet, mock circles, AsyncStorage fridge, palate-match Explore, drafts, etc.
- **Plan 1 (UI polish round 2)** has been partially implemented in a parallel session. 7 commits landed: `a6e1c01c`..`407e32aa`. These cover Tasks 1–7 of Plan 1. **Task 8 (Friends row visual distinction from Circle bars in the You tab) may still be outstanding** — verify by reading `app/(tabs)/profile.tsx` and the relevant Plan 1 section. If Task 8 isn't done, finish it before moving on.

Current HEAD at handoff: check `git log --oneline -1` — should be at least `803a3454` or later.

## The plans

Read each plan in full before starting it. They live in `docs/superpowers/plans/`:

1. **`2026-04-15-plan1-ui-polish-round2.md`** — 8 surgical UI fixes. **Likely mostly done.** Check status, finish Task 8 if needed, then move on.
2. **`2026-04-15-plan2-backend-v2-stubs.md`** — replace stubs (circles, fridge, friends blocking) with real Supabase data. Includes migrations 008, 009, 010 that Drew runs in the dashboard.
3. **`2026-04-15-plan5-baking-support.md`** — unit coverage, metric/imperial toggle, F/C toggle, pan size field, tappable inline step timers with `expo-notifications`. Includes migration 012.
4. **`2026-04-15-plan3-voice-stt.md`** — voice dictation + cook-mode commands. **FREE OPTIONS ONLY** (Apple Speech Framework, `expo-speech-recognition`, or iOS 18.1+ Apple Intelligence). Cloud STT is explicitly forbidden. Starts with a research pass. **Run this LAST** because it requires leaving Expo Go for a dev-client build.

**Run order:** Plan 1 (finish if needed) → Plan 2 → Plan 5 → Plan 3.

**Plan 4 (Ask Julian AI assistant) is deleted and deferred.** Do not resurrect it. Any reference you see in older docs to "Ask Julian" or "Plan 4" is stale.

## How to work

- **Use subagents for implementation** when a plan is large (Plan 2 and Plan 5 especially). Dispatch a general-purpose agent with the plan file as the spec. Prompt the subagent to report back with commit SHAs, tsc delta, and anything deferred.
- **For smaller plans or polish passes**, work directly with Read/Edit/Write/Bash in the main session.
- **One plan per subagent dispatch.** Do not bundle multiple plans into a single subagent run.
- **Ask Drew questions only if a plan is genuinely ambiguous.** Otherwise execute.
- **Read `CLAUDE.md` first.** It has conventions that override my assumptions.
- **Read the plan's own "Notes for the implementer" section** if it has one. Plans carry plan-specific rules that override anything general.

## Reporting back

At the end of each plan, report in this shape:

```
## Plan N summary

tsc: START → END (delta)

Commits (in order):
- <sha> <subject>
- ...

Tasks completed: N of M
Tasks skipped: <list + reason>

Deviations from spec: <anything you had to improvise on>

Known issues / deferred: <anything flagged for later>

Drew needs to:
- <manual testing checklist items>
- <migrations to run, if any>
- <anything else>
```

## Start here

Begin by running:

```bash
git log --oneline c7102f51..HEAD
git status --short
npx tsc --noEmit 2>&1 | wc -l
```

Then read `CLAUDE.md`, read `docs/superpowers/plans/2026-04-15-plan1-ui-polish-round2.md`, verify whether Plan 1 Task 8 is done (check `app/(tabs)/profile.tsx` for the Friends row styling vs `components/CircleCard.tsx` bar variant), finish Task 8 if outstanding, then move to Plan 2. Work through each plan in order, reporting between plans.

If you hit an unrecoverable blocker, STOP, commit whatever is safe, and report. Do not push, do not amend prior commits, do not force-anything.
