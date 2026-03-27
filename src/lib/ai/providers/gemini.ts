import { AIMessage, AIResponse } from '@/types/ai'
import { CanvasState } from '@/types/canvas'
import { buildSystemPrompt } from '../canvas-operations'

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
    body: JSON.stringify({ contents: geminiMessages })
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Gemini API error: ${err}`)
  }

  const data = await res.json()
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('Empty Gemini response')

  return JSON.parse(text) as AIResponse
}
