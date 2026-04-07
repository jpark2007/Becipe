import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function detectPlatform(url: string): 'tiktok' | 'instagram' | null {
  if (url.includes('tiktok.com')) return 'tiktok';
  if (url.includes('instagram.com')) return 'instagram';
  return null;
}

async function getTikTokCaption(url: string): Promise<{ caption: string; author: string } | null> {
  try {
    const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;
    const res = await fetch(oembedUrl);
    if (!res.ok) return null;
    const data = await res.json();
    return {
      caption: data.title ?? '',
      author: data.author_name ?? '',
    };
  } catch {
    return null;
  }
}

async function getInstagramCaption(url: string): Promise<{ caption: string; author: string } | null> {
  try {
    const token = Deno.env.get('INSTAGRAM_ACCESS_TOKEN') ?? '';
    if (!token) {
      // Fallback: try fetching the page and extracting meta description
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Dishr/1.0)' },
        redirect: 'follow',
      });
      if (!res.ok) return null;
      const html = await res.text();
      const descMatch = html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]*)"/) ??
                         html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"/);
      const titleMatch = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]*)"/);
      const caption = descMatch?.[1] ?? '';
      const author = titleMatch?.[1]?.match(/@(\w+)/)?.[1] ?? '';
      return { caption: caption.replace(/&amp;/g, '&').replace(/&quot;/g, '"'), author };
    }
    const oembedUrl = `https://graph.facebook.com/v18.0/instagram_oembed?url=${encodeURIComponent(url)}&access_token=${token}`;
    const res = await fetch(oembedUrl);
    if (!res.ok) return null;
    const data = await res.json();
    return {
      caption: data.title ?? '',
      author: data.author_name ?? '',
    };
  } catch {
    return null;
  }
}

async function extractRecipeWithLLM(caption: string, platform: string): Promise<{
  title: string;
  ingredients: { amount: string; unit: string; name: string }[];
  steps: { order: number; instruction: string }[];
  cuisine: string | null;
  servings: number | null;
  prep_time_min: number | null;
  cook_time_min: number | null;
}> {
  const apiKey = Deno.env.get('OPENROUTER_API_KEY');
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY not configured');
  }

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'openai/gpt-4o-mini',
      max_tokens: 1024,
      temperature: 0,
      messages: [
        {
          role: 'system',
          content: `You extract recipes from ${platform} video captions. Return ONLY valid JSON with this exact structure:
{
  "title": "short descriptive recipe title",
  "ingredients": [{"amount": "2", "unit": "cups", "name": "flour"}],
  "steps": [{"order": 1, "instruction": "step description"}],
  "cuisine": "Italian" or null,
  "servings": 4 or null,
  "prep_time_min": 15 or null,
  "cook_time_min": 30 or null
}

Rules:
- Parse amounts/units from ingredient text when possible (e.g. "2 cups flour" → amount:"2", unit:"cups", name:"flour")
- If no clear amount/unit, set them to empty strings
- Create clear step-by-step instructions from the caption content
- If the caption doesn't contain a recipe, infer what you can from the title/description and create reasonable steps
- Keep the title short and descriptive (not the full caption)
- Return ONLY the JSON object, no markdown or explanation`
        },
        {
          role: 'user',
          content: caption.slice(0, 2000),
        },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenRouter API error: ${res.status} ${err}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content ?? '';

  // Extract JSON from response (handle markdown code blocks)
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('LLM did not return valid JSON');
  }

  return JSON.parse(jsonMatch[0]);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    if (!url) {
      return new Response(JSON.stringify({ error: 'url is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const platform = detectPlatform(url);
    if (!platform) {
      return new Response(JSON.stringify({ error: 'URL must be a TikTok or Instagram link' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const videoData = platform === 'tiktok'
      ? await getTikTokCaption(url)
      : await getInstagramCaption(url);

    const caption = videoData?.caption ?? '';
    const author = videoData?.author ?? '';

    if (!caption) {
      return new Response(JSON.stringify({
        error: `Could not fetch caption from ${platform}. The post may be private or the link may be invalid.`,
      }), {
        status: 422,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use LLM to extract structured recipe from caption
    const extracted = await extractRecipeWithLLM(caption, platform);

    const result = {
      title: extracted.title || caption.split('\n')[0]?.slice(0, 80) || 'Imported Recipe',
      description: null,
      ingredients: extracted.ingredients?.length > 0
        ? extracted.ingredients
        : [{ amount: '', unit: '', name: 'See video for ingredients' }],
      steps: extracted.steps?.length > 0
        ? extracted.steps
        : [{ order: 1, instruction: 'Watch the video for step-by-step instructions.' }],
      tips: [],
      cover_image_url: null,
      video_url: url,
      prep_time_min: extracted.prep_time_min ?? null,
      cook_time_min: extracted.cook_time_min ?? null,
      servings: extracted.servings ?? null,
      cuisine: extracted.cuisine ?? null,
      source_type: platform,
      source_credit: author ? `@${author}` : null,
      source_url: url,
      source_name: platform === 'tiktok' ? 'TikTok' : 'Instagram',
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
