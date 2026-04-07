import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type Platform = 'tiktok' | 'instagram' | 'facebook' | 'x' | 'youtube';

function detectPlatform(url: string): Platform | null {
  if (url.includes('tiktok.com')) return 'tiktok';
  if (url.includes('instagram.com')) return 'instagram';
  if (url.includes('facebook.com') || url.includes('fb.watch')) return 'facebook';
  if (url.includes('twitter.com') || url.includes('x.com')) return 'x';
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  return null;
}

const PLATFORM_NAMES: Record<Platform, string> = {
  tiktok: 'TikTok',
  instagram: 'Instagram',
  facebook: 'Facebook',
  x: 'X',
  youtube: 'YouTube',
};

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

// Simple in-memory rate limiter (per-IP, resets on cold start)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20; // requests per window
const RATE_WINDOW = 60_000; // 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }
  entry.count++;
  return entry.count <= RATE_LIMIT;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!checkRateLimit(clientIp)) {
    return new Response(JSON.stringify({ error: 'Too many requests. Please wait a moment.' }), {
      status: 429,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { url, caption: userCaption } = await req.json();
    if (!url) {
      return new Response(JSON.stringify({ error: 'url is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate URL format
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid URL format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return new Response(JSON.stringify({ error: 'URL must use http or https' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    // Prevent SSRF: block private/internal IPs
    const hostname = parsedUrl.hostname;
    if (hostname === 'localhost' || hostname.startsWith('127.') || hostname.startsWith('10.') || hostname.startsWith('192.168.') || hostname === '0.0.0.0' || hostname.includes('169.254.') || hostname.endsWith('.local')) {
      return new Response(JSON.stringify({ error: 'URL not allowed' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const platform = detectPlatform(url);
    if (!platform) {
      return new Response(JSON.stringify({ error: 'URL must be from a supported platform (TikTok, Instagram, Facebook, X, YouTube)' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Try to scrape caption for platforms that support it
    let videoData: { caption: string; author: string } | null = null;
    if (platform === 'tiktok') {
      videoData = await getTikTokCaption(url);
    } else if (platform === 'instagram') {
      videoData = await getInstagramCaption(url);
    }
    // facebook, x, youtube: no free scraping — rely on client-provided caption from share intent

    const author = videoData?.author ?? '';
    // Use client-provided caption if available, otherwise use scraped caption
    const caption = userCaption?.trim() || videoData?.caption || '';

    // Check if caption is too weak (just hashtags, very short, etc.)
    const strippedCaption = caption.replace(/#\w+/g, '').trim();
    const isCaptionWeak = !strippedCaption || strippedCaption.length < 20;

    if (!caption || (isCaptionWeak && !userCaption)) {
      return new Response(JSON.stringify({
        error: 'caption_needed',
        message: `The caption is empty or just hashtags. Paste the recipe text to continue.`,
        partial: {
          author,
          source_type: platform,
          source_url: url,
          source_name: PLATFORM_NAMES[platform],
          source_credit: author ? `@${author}` : null,
        },
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
      source_name: PLATFORM_NAMES[platform],
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
