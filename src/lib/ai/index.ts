import { AIConfig, AIMessage, AIResponse } from '@/types/ai'
import { CanvasState } from '@/types/canvas'
import { callAnthropic } from './providers/anthropic'
import { callOpenAI } from './providers/openai'
import { callGemini } from './providers/gemini'
import { callGrok } from './providers/grok'
import { sanitizeOperations } from './canvas-operations'

export async function runAIAgent(
  config: AIConfig,
  messages: AIMessage[],
  canvasState: CanvasState
): Promise<AIResponse> {
  // Extract the last user message to pass to buildSystemPrompt for rule injection
  const lastUserMessage = [...messages].reverse().find(m => m.role === 'user')
  const userPrompt = lastUserMessage?.content ?? ''

  let response: AIResponse

  switch (config.provider) {
    case 'anthropic':
      response = await callAnthropic(config.apiKey, messages, canvasState, config.model, userPrompt)
      break
    case 'openai':
      response = await callOpenAI(config.apiKey, messages, canvasState, config.model, userPrompt)
      break
    case 'gemini':
      response = await callGemini(config.apiKey, messages, canvasState, config.model, userPrompt)
      break
    case 'grok':
      response = await callGrok(config.apiKey, messages, canvasState, config.model, userPrompt)
      break
    default:
      throw new Error(`Unknown provider: ${config.provider}`)
  }

  // Post-process operations from ALL providers:
  // - ensures clearLayer runs first for every layer
  // - clamps coordinates to canvas bounds
  // - enforces eye symmetry
  response.operations = sanitizeOperations(response.operations, canvasState)

  return response
}
