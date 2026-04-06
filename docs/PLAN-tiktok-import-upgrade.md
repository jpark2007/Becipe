# Plan: TikTok/Instagram Import Upgrade

Status: ON HOLD — waiting for Supabase access to test current implementation first
Priority: HIGH — first thing to build after testing current app

## Context

The current `parse-video` edge function uses regex heuristics to extract recipes from TikTok/Instagram captions. This is fragile — many captions don't follow structured formats. jpark2007 mentioned struggling with scraping.

**Before building this upgrade, TEST the current implementation end-to-end.** It may work better than expected, or the problems may be different than assumed.

## The Change

Replace the regex `parseCaption()` function with an LLM call via OpenRouter. Everything else stays the same.

### Current Flow
```
User pastes TikTok/Instagram URL
  → Edge function calls oEmbed API → gets caption + author
  → parseCaption() regex extracts ingredients/steps
  → Returns structured recipe (often incomplete/wrong)
```

### New Flow
```
User pastes TikTok/Instagram URL
  → Edge function calls oEmbed API → gets caption + author
  → OpenRouter API call (GPT-4o-mini) extracts structured recipe from caption
  → Returns structured recipe (much better extraction)
```

## What Changes

- `supabase/functions/parse-video/index.ts` — replace `parseCaption()` with OpenRouter LLM call
- Supabase Edge Function env vars — add `OPENROUTER_API_KEY` (server-side only, never exposed to frontend)
- The URL import (`parse-recipe`) also gets an LLM fallback for sites where JSON-LD fails

## Technical Details

### OpenRouter Call
- Model: `openai/gpt-4o-mini` (cheapest, fast, good enough for extraction)
- Prompt: System prompt asking for JSON output with ingredients, steps, tips, cuisine, times, servings
- Cost: ~$0.03 per 1,000 imports (basically free)
- Timeout: 10s (LLM should respond in 2-3s for short captions)

### Security
- API key stored in Supabase Edge Function secrets (Deno.env.get), never in frontend code
- Frontend calls the edge function same as before — no change to client
- Input sanitized before sending to LLM (strip HTML, limit length)
- LLM response validated against expected schema before returning

### URL Import Enhancement
- Current `parse-recipe` tries JSON-LD first (works well for major sites)
- Add fallback: if JSON-LD fails, scrape raw text + send to LLM for extraction
- Same OpenRouter key, same model
- This helps with sites that don't use Schema.org markup

### Fallback Chain (TikTok/Instagram)
1. Get caption from oEmbed
2. If caption exists → send to LLM for extraction
3. If LLM fails or caption empty → return "Watch the video" placeholder
4. User can always edit/fill in manually

### Fallback Chain (URL Import)
1. Fetch page HTML
2. Try JSON-LD Schema.org extraction (existing, works well)
3. If no JSON-LD → extract visible text + send to LLM
4. If LLM fails → return partial data with "Could not fully parse"
5. User can always edit/fill in manually

## What NOT to Change
- The oEmbed approach for getting captions (it works, it's free)
- The JSON-LD parser for URL import (it works great for major sites)
- The client-side code in add.tsx (it already handles the response format)
- No video downloading, no audio transcription (too fragile, not needed for MVP)

## Testing Plan
1. Test current implementation first (need Supabase access)
2. Collect 10-20 TikTok cooking URLs to use as test cases
3. Compare regex output vs LLM output on same captions
4. Test URL import on sites where JSON-LD fails (smaller blogs, etc.)

## Cost
- OpenRouter GPT-4o-mini: ~$0.15 per 1M input tokens
- Average caption: ~200 tokens
- Per import: ~$0.00003
- 1,000 imports/month: ~$0.03
- Effectively free

## Prerequisites
- [ ] Supabase access for Drew
- [ ] Test current parse-video function with real TikTok URLs
- [ ] Test current parse-recipe function with various URLs
- [ ] OpenRouter API key added to Supabase secrets
