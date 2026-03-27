import Anthropic from '@anthropic-ai/sdk'
import { AIMessage, AIResponse } from '@/types/ai'
import { CanvasState } from '@/types/canvas'
import { buildSystemPrompt } from '../canvas-operations'

export async function callAnthropic(
  apiKey: string,
  messages: AIMessage[],
  canvasState: CanvasState,
  model = 'claude-opus-4-6',
  userPrompt = ''
): Promise<AIResponse> {
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true })

  const response = await client.messages.create({
    model,
    max_tokens: 8192,
    system: buildSystemPrompt(canvasState, userPrompt),
    messages: messages.map(m => ({ role: m.role, content: m.content }))
  })

  const content = response.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response type')

  const clean = content.text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
  return JSON.parse(clean) as AIResponse
}
