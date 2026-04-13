/**
 * GitHub Models AI service (OpenAI-compatible API).
 *
 * Configuration (all optional — app runs fine without them):
 *   GITHUB_MODELS_TOKEN    - GitHub personal access token with models:read scope
 *   GITHUB_MODELS_ENDPOINT - Override the inference endpoint (default: Azure endpoint)
 *   GITHUB_MODELS_MODEL    - Model name (default: gpt-4o-mini)
 *
 * When GITHUB_MODELS_TOKEN is absent, isAIEnabled() returns false and
 * aiComplete() returns null so callers can fall back to deterministic logic.
 *
 * IMPORTANT: This module is server-side only. Never import it in client
 * components — the token must not be exposed to the browser.
 */

const ENDPOINT =
  process.env.GITHUB_MODELS_ENDPOINT ?? 'https://models.inference.ai.azure.com'
const TOKEN = process.env.GITHUB_MODELS_TOKEN
const MODEL = process.env.GITHUB_MODELS_MODEL ?? 'gpt-4o-mini'

export interface AIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

/** Returns true when GitHub Models credentials are configured. */
export function isAIEnabled(): boolean {
  return Boolean(TOKEN)
}

/**
 * Send a chat completion request to GitHub Models.
 * Returns the assistant's reply text, or null on error / when AI is disabled.
 */
export async function aiComplete(
  messages: AIMessage[],
  maxTokens = 500
): Promise<string | null> {
  if (!TOKEN) return null

  try {
    const response = await fetch(`${ENDPOINT}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${TOKEN}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        max_tokens: maxTokens,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      const body = await response.text()
      console.error('GitHub Models API error:', response.status, body)
      return null
    }

    const data = await response.json()
    return (data.choices?.[0]?.message?.content as string) ?? null
  } catch (error) {
    console.error('GitHub Models AI error:', error)
    return null
  }
}
