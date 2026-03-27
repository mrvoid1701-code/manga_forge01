import OpenAI from 'openai'
import { AIMessage, AIResponse } from '@/types/ai'
import { CanvasState } from '@/types/canvas'
import { buildSystemPrompt } from '../canvas-operations'

// Grok (xAI) uses an OpenAI-compatible API
export async function callGrok(
  apiKey: string,
  messages: AIMessage[],
  canvasState: CanvasState,
  model = 'grok-2',
  userPrompt = ''
): Promise<AIResponse> {
  const client = new OpenAI({
    apiKey,
    baseURL: 'https://api.x.ai/v1',
    dangerouslyAllowBrowser: true
  })

  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: buildSystemPrompt(canvasState, userPrompt) },
      ...messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))
    ]
  })

  const text = response.choices[0].message.content
  if (!text) throw new Error('Empty Grok response')

  return JSON.parse(text) as AIResponse
}
