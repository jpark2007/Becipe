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
- **Plan 1 (UI polish round 2)** is **complete**. 8 commits landed: `a6e1c01c`..`737906ec` (plus unrelated docs commit `803a3454`). Verified in a separate pass.
- **Migration 013** (`013_rename_palate_axes.sql`) has been applied in the Supabase dashboard. Palate axes are now `sweet / spicy / savory / sour / bitter` in both code and DB.

Current HEAD at handoff: `737906ec` or later.

## The plans

Read each plan in full before starting it. They live in `docs/superpowers/plans/`:

1. **`2026-04-15-plan1-ui-polish-round2.md`** — 8 surgical UI fixes. **Done.** Skip. Start at Plan 2.
2. **`2026-04-15-plan2-backend-v2-stubs.md`** — replace stubs (circles, fridge, friends blocking) with real Supabase data. Includes migrations 008, 009, 010 that Drew runs in the dashboard.
3. **`2026-04-15-plan5-baking-support.md`** — unit coverage, metric/imperial toggle, F/C toggle, pan size field, tappable inline step timers with `expo-notifications`. Includes migration 012.
4. **`2026-04-15-plan3-voice-stt.md`** — voice dictation + cook-mode commands. **FREE OPTIONS ONLY** (Apple Speech Framework, `expo-speech-recognition`, or iOS 18.1+ Apple Intelligence). Cloud STT is explicitly forbidden. Starts with a research pass. **Run this LAST** because it requires leaving Expo Go for a dev-client build.

**Run order:** Plan 2 → Plan 5 → Plan 3.

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

Then read `CLAUDE.md`, then read `docs/superpowers/plans/2026-04-15-plan2-backend-v2-stubs.md`, and start Plan 2. Work through Plans 2 → 5 → 3 in order, reporting between plans.

If you hit an unrecoverable blocker, STOP, commit whatever is safe, and report. Do not push, do not amend prior commits, do not force-anything.

## Deferred backlog

Do NOT pick these up unless Drew explicitly asks. Recorded here so they don't get lost:

- **Onboarding tutorial screen.** After the palate quiz, Drew wants a brief "how to use the app" walkthrough (tap the tabs, add a recipe, log a try, join a circle). Not built yet. Parked until Plans 2/5/3 ship. Onboarding stays *quiz + tutorial* — appliances, equipment, diet, and other prefs belong in **Settings**, not onboarding.
- **Constraint-based onboarding pivot (ex-"Plan 6").** Replacing the palate quiz with equipment/time/difficulty/diet filters was considered and explicitly rejected by Drew. Do not resurrect.

---

# For Drew — sharing with Jonah without merging to main

Below is for Drew (the human), not the agent. Instructions for showing this branch to Jonah (co-founder, `@jpark2007` on GitHub) for review without pushing to `main`.

## Why draft PRs are the right tool here

A **draft PR** is GitHub's explicit "review this, don't merge yet" state. GitHub will not let anyone merge a draft PR until someone manually marks it ready for review, so it's a safety rail against accidental merges. Jonah gets the full Files Changed diff, can leave inline comments, and can pull the branch locally if he wants to run it.

## Commands to run (once, from the repo root)

```bash
# 1. Push the branch to origin (-u sets upstream tracking so later git push
#    from this branch doesn't need args)
git push -u origin ak-ui-v2

# 2. Open a draft PR against main. --draft is the important flag.
gh pr create --draft --base main --head ak-ui-v2 \
  --title "v2 redesign — review only, do not merge yet" \
  --body "Draft for Jonah's review. Do not merge — we may roll this back if we decide v2 isn't the direction.

What's in this branch:
- v2 editorial redesign (22 commits)
- Plan 1 UI polish round 2 (8 commits)
- Migration 013 (palate axis rename — already applied to the live Supabase DB)

How to review:
- Read the Files Changed tab on GitHub, or check out locally with: git fetch && git checkout ak-ui-v2
- Leave inline comments on anything you want changed
- Do NOT mark Ready for Review or merge — this stays draft until Drew says otherwise

If we scrap it:
- Close this PR without merging
- Nothing has been merged to main, so there is nothing to revert"
```

## Sharing with Jonah

`gh pr create` prints the PR URL when it finishes. Send that URL to Jonah directly — no need to wait for GitHub notifications.

## If you decide to ship it

Once Jonah approves and you want to actually merge:
1. On GitHub, click **Ready for review** to promote the draft PR.
2. Approve it.
3. Merge via the GitHub UI (squash or merge commit — your call). Do NOT merge locally with `git merge` into `main`.

## If you decide to scrap it

```bash
# Close the PR on GitHub (or: gh pr close <pr-number>)
# Then delete the branches:
git push origin --delete ak-ui-v2   # removes remote branch
git checkout main
git branch -D ak-ui-v2               # removes local branch
```

`main` is untouched throughout. There is nothing to revert.

## Hard don'ts

- **Don't** push to `main` directly.
- **Don't** merge the PR while it's still draft (you can't anyway, that's the point).
- **Don't** force-push `ak-ui-v2` after Jonah starts reviewing — it will invalidate his line comments and make them hard to follow.
- **Don't** amend prior commits on the branch while the PR is open — same reason.
