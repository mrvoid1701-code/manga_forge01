import { NextRequest, NextResponse } from 'next/server'
import { runAIAgent } from '@/lib/ai'
import { AIConfig, AIMessage } from '@/types/ai'
import { CanvasState } from '@/types/canvas'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { config, messages, canvasState } = body as {
      config: AIConfig
      messages: AIMessage[]
      canvasState: CanvasState
    }

    if (!config?.apiKey || !config?.provider) {
      return NextResponse.json({ error: 'Missing AI config' }, { status: 400 })
    }

    if (!messages?.length) {
      return NextResponse.json({ error: 'Messages are required' }, { status: 400 })
    }

    const response = await runAIAgent(config, messages, canvasState)
    return NextResponse.json(response)
  } catch (error) {
    console.error('AI route error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
