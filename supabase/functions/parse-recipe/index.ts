import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ParsedRecipe {
  title: string;
  description: string | null;
  ingredients: { amount: string; unit: string; name: string }[];
  steps: { order: number; instruction: string }[];
  tips: { text: string }[];
  cover_image_url: string | null;
  prep_time_min: number | null;
  cook_time_min: number | null;
  servings: number | null;
  cuisine: string | null;
  source_name: string;
  source_url: string;
}

function parseDuration(iso: string | null): number | null {
  if (!iso) return null;
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return null;
  const hours = parseInt(match[1] ?? '0');
  const mins = parseInt(match[2] ?? '0');
  return hours * 60 + mins;
}

function parseIngredient(raw: string): { amount: string; unit: string; name: string } {
  // Simple heuristic: first word(s) are amount, next may be unit, rest is name
  const parts = raw.trim().split(/\s+/);
  const amount = parts[0] ?? '';
  const commonUnits = ['cup','cups','tbsp','tsp','tablespoon','tablespoons','teaspoon','teaspoons',
    'oz','lb','lbs','g','kg','ml','l','clove','cloves','slice','slices','pinch','handful'];
  let unit = '';
  let nameStart = 1;
  if (parts[1] && commonUnits.includes(parts[1].toLowerCase().replace(/s$/, ''))) {
    unit = parts[1];
    nameStart = 2;
  }
  const name = parts.slice(nameStart).join(' ');
  return { amount, unit, name };
}

function stripFluff(text: string): string {
  // Remove common recipe blog filler phrases
  return text
    .replace(/\(see note.*?\)/gi, '')
    .replace(/\(optional.*?\)/gi, '(optional)')
    .replace(/\n{2,}/g, ' ')
    .trim();
}

function extractCuisine(tags: string[] | string | null): string | null {
  const cuisines = ['Italian','Japanese','Mexican','Indian','French','American','Chinese',
    'Thai','Mediterranean','Greek','Spanish','Korean','Vietnamese','Middle Eastern'];
  const all = Array.isArray(tags) ? tags.join(' ') : (tags ?? '');
  for (const c of cuisines) {
    if (all.toLowerCase().includes(c.toLowerCase())) return c;
  }
  return null;
}

async function parseSchemaOrg(html: string, url: string): Promise<ParsedRecipe | null> {
  // Extract JSON-LD blocks
  const ldJsonMatches = html.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi);

  for (const match of ldJsonMatches) {
    try {
      const data = JSON.parse(match[1]);
      const candidates = Array.isArray(data) ? data : [data, ...(data['@graph'] ?? [])];

      for (const item of candidates) {
        if (item['@type'] !== 'Recipe' && !String(item['@type']).includes('Recipe')) continue;

        const rawSteps: string[] = [];
        const rawInstructions = item.recipeInstructions ?? [];
        for (const s of rawInstructions) {
          if (typeof s === 'string') rawSteps.push(s);
          else if (s.text) rawSteps.push(s.text);
          else if (s.itemListElement) {
            for (const sub of s.itemListElement) rawSteps.push(sub.text ?? sub);
          }
        }

        // Separate tips from steps: last 1-2 steps that look like "notes" or "tips"
        const tipKeywords = /^(note|tip|serve|storage|make ahead|pro tip)/i;
        const tips: { text: string }[] = [];
        const steps: { order: number; instruction: string }[] = [];
        for (const [i, raw] of rawSteps.entries()) {
          const clean = stripFluff(raw);
          if (tipKeywords.test(clean)) {
            tips.push({ text: clean });
          } else {
            steps.push({ order: steps.length + 1, instruction: clean });
          }
        }

        const ingredients = (item.recipeIngredient ?? []).map((r: string) => parseIngredient(r));

        const hostname = new URL(url).hostname.replace('www.', '');

        return {
          title: item.name ?? 'Recipe',
          description: item.description ?? null,
          ingredients,
          steps,
          tips,
          cover_image_url: Array.isArray(item.image) ? item.image[0]?.url ?? item.image[0] : item.image?.url ?? item.image ?? null,
          prep_time_min: parseDuration(item.prepTime),
          cook_time_min: parseDuration(item.cookTime),
          servings: parseInt(item.recipeYield) || null,
          cuisine: extractCuisine(item.recipeCuisine ?? item.recipeCategory ?? item.keywords),
          source_name: item.author?.name ?? hostname,
          source_url: url,
        };
      }
    } catch {
      continue;
    }
  }
  return null;
}

async function fallbackParse(html: string, url: string): Promise<ParsedRecipe> {
  const titleMatch = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
  const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : 'Imported Recipe';
  const hostname = new URL(url).hostname.replace('www.', '');
  return {
    title,
    description: null,
    ingredients: [],
    steps: [{ order: 1, instruction: 'Recipe steps could not be parsed automatically. Please add them manually.' }],
    tips: [],
    cover_image_url: null,
    prep_time_min: null,
    cook_time_min: null,
    servings: null,
    cuisine: null,
    source_name: hostname,
    source_url: url,
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    if (!url || typeof url !== 'string') {
      return new Response(JSON.stringify({ error: 'url is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
    });
    const html = await response.text();

    const recipe = (await parseSchemaOrg(html, url)) ?? (await fallbackParse(html, url));

    return new Response(JSON.stringify(recipe), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
