export type AIProvider = 'anthropic' | 'openai' | 'gemini' | 'grok'

export interface AIConfig {
  provider: AIProvider
  apiKey: string
  model?: string
}

export interface AIMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface AIResponse {
  operations: import('./canvas').CanvasOperation[]
  explanation: string
}
