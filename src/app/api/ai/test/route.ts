import { NextResponse } from 'next/server'
import { getAIProvider } from '@/lib/ai'

/**
 * GET /api/ai/test
 *
 * Smoke-tests the active AI provider.  Safe to call in development —
 * returns a short planner note using the configured model (or the
 * deterministic fallback when GITHUB_TOKEN is not set).
 *
 * Response shape:
 *   { provider: "github_models" | "fallback", model: string | null, result: string }
 */
export async function GET() {
  try {
    const ai = getAIProvider()
    const result = await ai.generatePlannerNote('MCQ', 'Networks of Exchange', false)

    return NextResponse.json({
      provider: ai.isLive ? 'github_models' : 'fallback',
      model: ai.isLive
        ? (process.env.GITHUB_MODELS_MODEL ?? 'gpt-4o-mini')
        : null,
      result,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
