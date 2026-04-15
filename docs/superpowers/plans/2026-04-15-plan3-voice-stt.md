# Plan 3 — Voice Backend (Speech-to-Text)

**Date:** 2026-04-15
**Branch:** `ak-ui-v2` or a new branch — STT requires a native module, so this probably needs a **dev client build**, not Expo Go.
**Run in:** a new chat. Starts with a research pass, then implementation.

## Context

The v2 redesign shipped two voice surfaces as UI stubs:
1. **Add Recipe voice dictation** — button with a waveform icon in `app/add-recipe.tsx`. Currently does nothing.
2. **Cook Mode voice-cook** — `app/recipe/[id]/voice-cook.tsx`. Currently has a cycling state label stub, no real listening.

This plan makes both real. The hard question is *which STT path* — that's the first task.

**Drew's earlier note (paraphrased):** "tiktok import isn't regex or openrouter we changed to use apple's native stuff" — suggesting Apple Speech Framework is already under consideration for other flows. Investigate if that code/config exists.

## Task 1 — Research pass (write up findings, no code yet)

Spend ~15 minutes on this. Options to evaluate:

### Option A — `expo-speech-recognition`
- npm package `expo-speech-recognition` (verify it exists and is maintained as of 2026)
- Wraps both iOS Speech Framework and Android SpeechRecognizer
- Works in dev client, may or may not work in Expo Go
- **Pros:** Expo-native, cross-platform, declarative
- **Cons:** Maintenance status unknown; may require permissions setup in `app.json`

### Option B — Native Apple Speech Framework via a custom Expo module
- Build a thin native module that wraps `SFSpeechRecognizer`
- iOS-only. Android would need a parallel implementation later.
- **Pros:** Battle-tested, on-device, free, low latency, no internet needed
- **Cons:** requires dev-client build, dropping Expo Go. Must add `NSSpeechRecognitionUsageDescription` and `NSMicrophoneUsageDescription` to `Info.plist`.

### Option C — Cloud STT (OpenAI Whisper API)
- Send audio blob to `https://api.openai.com/v1/audio/transcriptions`
- Record audio with `expo-av` (record), upload, receive text
- **Pros:** high accuracy, all platforms, no native module
- **Cons:** costs money (~$0.006/min), requires internet, latency ~1–3s, API key management

### Option D — iOS 18+ Apple Intelligence (native)
- On-device LLM-enhanced STT if user is on iOS 18.1+
- Requires Expo SDK 55+ native integration
- **Pros:** best-in-class on-device accuracy, zero cost, private
- **Cons:** iOS-18-only, still cutting-edge, limited documentation

**Deliverable for Task 1:** a short written comparison (save to this plan file as a trailing note or new doc `docs/voice-stt-research.md`). Pick ONE option and justify it in ≤100 words. Factors to weigh:
- Cost (free strongly preferred per Drew's low-cost preference in memory)
- Dev experience (Expo Go vs dev client)
- Cross-platform (iOS-only acceptable for v1 if Android path is documented)
- Latency (cook mode especially needs <500ms response to "next" commands)
- Privacy (on-device preferred)

**My prior lean (implementer should validate):** Option A (`expo-speech-recognition`) if it's still maintained and works on iOS. Fallback to Option B if the package is abandoned.

## Task 2 — Add Recipe voice dictation (Phase 1)

Goal: user taps the waveform button next to an input field, speaks, text appears in the field.

**Implementation per Option A (assuming A is picked):**

```tsx
// app/add-recipe.tsx
import { useSpeechRecognition } from 'expo-speech-recognition';

const { transcript, isListening, start, stop } = useSpeechRecognition({
  lang: 'en-US',
  continuous: false,
});

// Button:
<Pressable onPress={() => (isListening ? stop() : start())}>
  <MaterialCommunityIcons name={isListening ? 'waveform' : 'waveform'} />
</Pressable>

// On transcript change, update the currently-focused field's value
useEffect(() => {
  if (transcript) onFieldUpdate(transcript);
}, [transcript]);
```

**UX:**
- Tap waveform → starts listening, icon pulses, button glows clay
- User speaks (e.g. "two cups of flour")
- Stops listening on silence (auto) or manual tap
- Result text appears in the active field
- Basic parsing: if user says "next ingredient", create a new ingredient row. If "step two: mix until smooth", create step two. Keep parsing minimal — v1 just dumps text into the focused field.

**Permissions:**
- Add to `app.json` → `ios.infoPlist`:
  ```json
  "NSSpeechRecognitionUsageDescription": "Becipe uses speech recognition to help you dictate recipes hands-free.",
  "NSMicrophoneUsageDescription": "Becipe uses the microphone to listen when you dictate."
  ```
- Request permission on first tap; degrade gracefully if denied.

## Task 3 — Cook Mode voice-cook (Phase 2)

Goal: user is cooking with hands dirty, says "next" → advances step. Says "repeat" → re-reads current step. Says "back" → previous step.

**File:** `app/recipe/[id]/voice-cook.tsx`

**Command grammar (keyword spotting):**

| Say | Action |
|-----|--------|
| "next", "next step", "done" | Advance to next step |
| "back", "previous", "go back" | Previous step |
| "repeat", "again", "what" | Re-read current step (TTS) |
| "stop", "pause" | Pause listening |
| "resume", "start listening" | Resume listening |
| "ingredients" | Read ingredient list |
| "finish", "all done" | Complete cook, go to log-a-try |

**Implementation:**
- Start continuous listening on mount
- On each transcript chunk, normalize + check against command keywords
- When a command matches, fire the action and reset transcript buffer
- Use `expo-speech` (TTS) to read the current step aloud on advance

**Text-to-speech setup:**
```tsx
import * as Speech from 'expo-speech';
Speech.speak(currentStep.instruction, { language: 'en-US', rate: 1.0 });
```

**Keep-awake:** use `expo-keep-awake` (already in deps) to prevent screen dimming during cook mode.

**Visual feedback:**
- Listening indicator (pulsing waveform) when STT is active
- Last heard command shown briefly at the bottom: "heard: 'next'"
- Current step is huge, centered, easy to read from arm's length

## Task 4 — Error handling + edge cases

- Permission denied → show a clear CTA to re-grant in Settings
- Listening fails mid-session → auto-restart once, then surface an error
- No internet (if Option C chosen) → cook mode falls back to manual navigation
- Background / foreground transition → stop listening on background, restart on foreground
- User starts listening but never speaks → auto-timeout after 10s

## Task 5 — Documentation

Update `docs/voice-stt.md` (new file) with:
- Which option was chosen and why
- Permission setup steps
- Command grammar reference
- Known limitations
- Upgrade path (e.g. "if we outgrow on-device, swap to Whisper")

---

## Task list

- [ ] Research pass — compare 4 options, pick one, write ≤100-word justification
- [ ] Install the chosen STT package (if any), update `package.json`
- [ ] `app.json` — add iOS permission strings (NSSpeechRecognitionUsageDescription, NSMicrophoneUsageDescription)
- [ ] `app/add-recipe.tsx` — wire waveform button to real STT
- [ ] `app/recipe/[id]/voice-cook.tsx` — wire continuous listening with command grammar
- [ ] Add `expo-speech` TTS for step readouts
- [ ] Permission-denied fallback UI
- [ ] `docs/voice-stt.md` — write documentation
- [ ] Test end-to-end: dictate an ingredient, cook-mode "next" advances, "repeat" re-reads

---

## Testing (Drew walks this)

1. Install fresh: permissions prompt appears on first voice button tap
2. Deny permission: fallback UI shows "Voice needs microphone + speech permission — enable in Settings"
3. Grant: waveform pulses, dictating "two cups of flour" fills the current field
4. Cook mode: open a recipe, start cooking, say "next" — advances. Say "repeat" — re-reads. Say "back" — previous step.
5. Silence test: stop talking mid-cook, listening stays alive, next command still works
6. Background test: background the app during cook mode, foreground again, listening resumes

## Done =

- STT option chosen and documented
- Add Recipe voice dictation works for ingredient / step fields
- Cook Mode supports next / back / repeat voice commands
- TTS reads steps aloud on advance
- Permission handling is clean (denied + re-grant flow works)
- Docs written
- tsc baseline held
- Branch remains local

## Notes

- **If this plan hits a dead end** (e.g. `expo-speech-recognition` is abandoned, all options are painful) — STOP. Report back with the research writeup. Voice is not launch-critical; better to defer than ship broken.
- **Dev client required** for most options. If Drew is still on Expo Go, either: (a) build a dev client first via `npx expo prebuild` + `npx expo run:ios`, or (b) defer until he's ready to leave Expo Go.
- **Low cost priority:** Options A, B, D are free; Option C (Whisper) costs money. Strongly prefer the free paths unless accuracy is unusable.
