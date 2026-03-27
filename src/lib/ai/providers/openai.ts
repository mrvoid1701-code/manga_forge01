import OpenAI from 'openai'
import { AIMessage, AIResponse } from '@/types/ai'
import { CanvasState } from '@/types/canvas'
import { buildSystemPrompt } from '../canvas-operations'

export async function callOpenAI(
  apiKey: string,
  messages: AIMessage[],
  canvasState: CanvasState,
  model = 'gpt-4o',
  userPrompt = ''
): Promise<AIResponse> {
  const client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true })

  const response = await client.chat.completions.create({
    model,
    max_tokens: 8192,
    messages: [
      { role: 'system', content: buildSystemPrompt(canvasState, userPrompt) },
      ...messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))
    ]
  })

  const text = response.choices[0].message.content
  if (!text) throw new Error('Empty response')

  const clean = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
  return JSON.parse(clean) as AIResponse
}
