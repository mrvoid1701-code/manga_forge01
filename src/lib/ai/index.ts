import { AIConfig, AIMessage, AIResponse } from '@/types/ai'
import { CanvasState } from '@/types/canvas'
import { callAnthropic } from './providers/anthropic'
import { callOpenAI } from './providers/openai'
import { callGemini } from './providers/gemini'
import { callGrok } from './providers/grok'

export async function runAIAgent(
  config: AIConfig,
  messages: AIMessage[],
  canvasState: CanvasState
): Promise<AIResponse> {
  switch (config.provider) {
    case 'anthropic':
      return callAnthropic(config.apiKey, messages, canvasState, config.model)
    case 'openai':
      return callOpenAI(config.apiKey, messages, canvasState, config.model)
    case 'gemini':
      return callGemini(config.apiKey, messages, canvasState, config.model)
    case 'grok':
      return callGrok(config.apiKey, messages, canvasState, config.model)
    default:
      throw new Error(`Unknown provider: ${config.provider}`)
  }
}
