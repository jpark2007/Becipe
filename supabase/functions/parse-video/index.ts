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

function parseCaption(caption: string): {
  ingredients: { amount: string; unit: string; name: string }[];
  steps: { order: number; instruction: string }[];
} {
  const lines = caption.split('\n').map(l => l.trim()).filter(Boolean);
  const ingredients: { amount: string; unit: string; name: string }[] = [];
  const steps: { order: number; instruction: string }[] = [];

  let mode: 'ingredients' | 'steps' | 'none' = 'none';

  for (const line of lines) {
    const lower = line.toLowerCase();
    if (/ingredient|what you need|you'll need|shopping/i.test(lower)) {
      mode = 'ingredients';
      continue;
    }
    if (/instruction|step|direction|method|how to|let's make/i.test(lower)) {
      mode = 'steps';
      continue;
    }

    // Numbered step detection: "1." or "Step 1"
    const stepMatch = line.match(/^(?:step\s*)?(\d+)[.)]\s*(.+)/i);
    if (stepMatch) {
      steps.push({ order: steps.length + 1, instruction: stepMatch[2].trim() });
      mode = 'steps';
      continue;
    }

    // Bullet / dash ingredient
    const bulletMatch = line.match(/^[-•*]\s*(.+)/);
    if (bulletMatch) {
      const text = bulletMatch[1].trim();
      ingredients.push({ amount: '', unit: '', name: text });
      continue;
    }

    if (mode === 'ingredients' && line.length < 80) {
      ingredients.push({ amount: '', unit: '', name: line });
    } else if (mode === 'steps') {
      steps.push({ order: steps.length + 1, instruction: line });
    }
  }

  return { ingredients, steps };
}

async function getTikTokCaption(url: string): Promise<{ caption: string; author: string; embed_url: string } | null> {
  try {
    const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;
    const res = await fetch(oembedUrl);
    const data = await res.json();
    return {
      caption: data.title ?? '',
      author: data.author_name ?? '',
      embed_url: data.html ?? url,
    };
  } catch {
    return null;
  }
}

async function getInstagramCaption(url: string): Promise<{ caption: string; author: string; embed_url: string } | null> {
  try {
    const oembedUrl = `https://graph.facebook.com/v18.0/instagram_oembed?url=${encodeURIComponent(url)}&access_token=${Deno.env.get('INSTAGRAM_ACCESS_TOKEN') ?? ''}`;
    const res = await fetch(oembedUrl);
    const data = await res.json();
    return {
      caption: data.title ?? '',
      author: data.author_name ?? '',
      embed_url: url,
    };
  } catch {
    return null;
  }
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
    const { ingredients, steps } = parseCaption(caption);

    const result = {
      title: caption.split('\n')[0]?.slice(0, 80) || 'Imported Recipe',
      description: null,
      ingredients,
      steps: steps.length > 0 ? steps : [{ order: 1, instruction: 'Watch the video for step-by-step instructions.' }],
      tips: [],
      cover_image_url: null,
      video_url: url,
      prep_time_min: null,
      cook_time_min: null,
      servings: null,
      cuisine: null,
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
