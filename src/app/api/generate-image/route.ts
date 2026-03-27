import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { prompt, provider, apiKey, width = 832, height = 1216 } = await req.json()

  if (!prompt || !apiKey) {
    return NextResponse.json({ error: 'Missing prompt or apiKey' }, { status: 400 })
  }

  try {
    let imageUrl: string

    switch (provider) {
      case 'replicate':
        imageUrl = await generateWithReplicate(prompt, apiKey, width, height)
        break
      case 'dalle':
        imageUrl = await generateWithDalle(prompt, apiKey, width, height)
        break
      default:
        return NextResponse.json({ error: `Unknown provider: ${provider}` }, { status: 400 })
    }

    return NextResponse.json({ url: imageUrl })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// ── Replicate — animagine-xl-3.1 (best manga quality) ────────────────────────
async function generateWithReplicate(
  prompt: string,
  apiKey: string,
  width: number,
  height: number
): Promise<string> {
  const mangaPrompt = [
    'masterpiece, best quality, ultra detailed,',
    '(manga style:1.4), (black and white manga:1.3), (ink lineart:1.4),',
    '(clean bold outlines:1.3), (professional manga art:1.2),',
    prompt,
    ', Shonen Jump manga, dramatic lighting, expressive face, detailed eyes',
  ].join(' ')

  const negativePrompt = [
    'nsfw, lowres, bad anatomy, bad hands, text, error, missing fingers,',
    'cropped, worst quality, low quality, jpeg artifacts, signature, watermark,',
    'photo, realistic, 3d render, western comic, blurry, ugly, deformed',
  ].join(' ')

  // Use latest version endpoint — no hardcoded version hash needed
  const startRes = await fetch(
    'https://api.replicate.com/v1/models/lucataco/animagine-xl-3.1/predictions',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        Prefer: 'wait=60',  // Wait up to 60s for result (avoids polling for fast runs)
      },
      body: JSON.stringify({
        input: {
          prompt: mangaPrompt,
          negative_prompt: negativePrompt,
          width: Math.min(width, 1024),
          height: Math.min(height, 1024),
          num_inference_steps: 28,
          guidance_scale: 7,
          scheduler: 'DPMSolverMultistepScheduler',
          add_quality_tags: true,
        },
      }),
    }
  )

  if (!startRes.ok) {
    const err = await startRes.json()
    throw new Error(`Replicate error: ${err.detail ?? JSON.stringify(err)}`)
  }

  const prediction = await startRes.json()

  // If result already available (Prefer: wait worked)
  if (prediction.status === 'succeeded') {
    const out = prediction.output
    return Array.isArray(out) ? out[0] : out
  }

  // Otherwise poll
  return await pollReplicate(prediction.id, apiKey)
}

async function pollReplicate(id: string, apiKey: string): Promise<string> {
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 2000))
    const res = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    })
    const data = await res.json()
    if (data.status === 'succeeded') {
      return Array.isArray(data.output) ? data.output[0] : data.output
    }
    if (data.status === 'failed' || data.status === 'canceled') {
      throw new Error(`Replicate prediction ${data.status}: ${data.error ?? ''}`)
    }
  }
  throw new Error('Replicate: timed out after 120s')
}

// ── DALL-E 3 ──────────────────────────────────────────────────────────────────
async function generateWithDalle(
  prompt: string,
  apiKey: string,
  width: number,
  height: number
): Promise<string> {
  const size = width > height ? '1792x1024' : width < height ? '1024x1792' : '1024x1024'

  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'dall-e-3',
      prompt: `Black and white Japanese manga illustration, clean ink lineart, bold outlines, Shonen Jump style (like Naruto or Bleach). Scene: ${prompt}. No color, pure black ink on white paper, professional manga artist quality, no text, no speech bubbles.`,
      size,
      quality: 'hd',
      n: 1,
    }),
  })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(`DALL-E 3: ${err.error?.message ?? JSON.stringify(err)}`)
  }

  const data = await res.json()
  const url = data.data?.[0]?.url
  if (!url) throw new Error('DALL-E 3: no image URL in response')
  return url
}
