import { AIMessage, AIResponse } from '@/types/ai'
import { CanvasState } from '@/types/canvas'
import { buildSystemPrompt } from '../canvas-operations'

/**
 * Robustly extract a JSON object from text that may contain markdown fences,
 * prose before/after the JSON block, or other surrounding noise.
 * Strategy:
 *  1. Try the raw text first (Gemini sometimes returns clean JSON).
 *  2. Find the first '{' and last '}' and attempt to parse the substring.
 *  3. Strip a single ```json … ``` or ``` … ``` fence and retry.
 */
function extractJSON(text: string): AIResponse {
  const raw = text.trim()

  // Attempt 1 — try as-is
  try { return JSON.parse(raw) } catch { /* fall through */ }

  // Attempt 2 — find outermost { … } braces
  const firstBrace = raw.indexOf('{')
  const lastBrace = raw.lastIndexOf('}')
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    const slice = raw.slice(firstBrace, lastBrace + 1)
    try { return JSON.parse(slice) } catch { /* fall through */ }
  }

  // Attempt 3 — strip code fence and try again
  const fenced = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
  try { return JSON.parse(fenced) } catch { /* fall through */ }

  throw new Error(
    `Gemini returned non-JSON response. First 300 chars: ${raw.slice(0, 300)}`
  )
}

export async function callGemini(
  apiKey: string,
  messages: AIMessage[],
  canvasState: CanvasState,
  model = 'gemini-2.0-flash'
): Promise<AIResponse> {
  // Gemini uses its own REST API format
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

  const systemPrompt = buildSystemPrompt(canvasState)

  // Prepend system prompt as first user turn (Gemini doesn't have a system role)
  const geminiMessages = [
    { role: 'user', parts: [{ text: systemPrompt }] },
    { role: 'model', parts: [{ text: 'Understood. I will return only valid JSON canvas operations.' }] },
    ...messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }))
  ]

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: geminiMessages,
      generationConfig: {
        // Lower temperature for more deterministic JSON output
        temperature: 0.4,
        // Request JSON output mode when supported
        responseMimeType: 'application/json'
      }
    })
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Gemini API error: ${err}`)
  }

  const data = await res.json()
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) {
    console.error('[Gemini] Unexpected response shape:', JSON.stringify(data).slice(0, 500))
    throw new Error('Empty Gemini response')
  }

  console.log('[Gemini] Raw response text:', text.slice(0, 500))
  return extractJSON(text)
}
