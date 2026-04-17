// lib/seed-images.ts
// pollinations.ai URL-based AI image generation.
// URLs are stable when seed= is provided.

const BASE = 'https://image.pollinations.ai/prompt';

export function pollinationsUrl(prompt: string, seed: number, size = 800): string {
  const encoded = encodeURIComponent(prompt);
  return `${BASE}/${encoded}?width=${size}&height=${size}&seed=${seed}&nologo=true&model=flux`;
}
