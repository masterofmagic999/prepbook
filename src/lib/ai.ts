/**
 * AI service with multi-provider support and automatic fallback.
 *
 * Supported providers (configure via AI_PROVIDER env var):
 *
 *   github_models  (default when GITHUB_MODELS_TOKEN is set)
 *     GITHUB_MODELS_TOKEN    - GitHub PAT with models:read scope
 *     GITHUB_MODELS_ENDPOINT - Override inference endpoint (optional)
 *     GITHUB_MODELS_MODEL    - Model name (default: gpt-4o-mini)
 *
 *   openrouter  (set AI_PROVIDER=openrouter)
 *     OPENROUTER_API_KEY     - API key from openrouter.ai
 *     OPENROUTER_MODEL       - Model name (default: meta-llama/llama-3.1-8b-instruct:free)
 *     OPENROUTER_BASE_URL    - Override base URL (optional)
 *     OPENROUTER_SITE_URL    - HTTP-Referer header value (optional)
 *     OPENROUTER_APP_NAME    - X-Title header value (optional)
 *
 *   cerebras  (set AI_PROVIDER=cerebras)
 *     CEREBRAS_API_KEY       - API key from cloud.cerebras.ai
 *     CEREBRAS_MODEL         - Model name (default: llama3.1-8b)
 *     CEREBRAS_BASE_URL      - Override base URL (optional)
 *
 * When no provider credentials are present, isAIEnabled() returns false and
 * aiComplete() returns null so callers fall back to deterministic logic.
 *
 * IMPORTANT: This module is server-side only. Never import it in client
 * components — keys must never be exposed to the browser.
 */

// ── GitHub Models ─────────────────────────────────────────────────────────────
const GM_ENDPOINT =
  process.env.GITHUB_MODELS_ENDPOINT ?? 'https://models.inference.ai.azure.com'
const GM_TOKEN = process.env.GITHUB_MODELS_TOKEN
const GM_MODEL = process.env.GITHUB_MODELS_MODEL ?? 'gpt-4o-mini'

// ── OpenRouter ────────────────────────────────────────────────────────────────
const OR_KEY = process.env.OPENROUTER_API_KEY
const OR_MODEL =
  process.env.OPENROUTER_MODEL ?? 'meta-llama/llama-3.1-8b-instruct:free'
const OR_BASE_URL =
  process.env.OPENROUTER_BASE_URL ?? 'https://openrouter.ai/api/v1'
const OR_SITE_URL = process.env.OPENROUTER_SITE_URL ?? ''
const OR_APP_NAME = process.env.OPENROUTER_APP_NAME ?? 'PrepBook'

// ── Cerebras ──────────────────────────────────────────────────────────────────
const CB_KEY = process.env.CEREBRAS_API_KEY
const CB_MODEL = process.env.CEREBRAS_MODEL ?? 'llama3.1-8b'
const CB_BASE_URL =
  process.env.CEREBRAS_BASE_URL ?? 'https://api.cerebras.ai/v1'

// ── Provider selection ────────────────────────────────────────────────────────
// Explicit override wins; otherwise auto-detect from available credentials.
function resolveProvider(): 'github_models' | 'openrouter' | 'cerebras' | null {
  const explicit = process.env.AI_PROVIDER?.toLowerCase()
  if (explicit === 'github_models') return GM_TOKEN ? 'github_models' : null
  if (explicit === 'openrouter') return OR_KEY ? 'openrouter' : null
  if (explicit === 'cerebras') return CB_KEY ? 'cerebras' : null
  // Auto-detect: first key that is present wins
  if (GM_TOKEN) return 'github_models'
  if (OR_KEY) return 'openrouter'
  if (CB_KEY) return 'cerebras'
  return null
}

export interface AIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

/** Returns true when any AI provider credentials are configured. */
export function isAIEnabled(): boolean {
  return resolveProvider() !== null
}

// ── Provider implementations ──────────────────────────────────────────────────

async function completeGitHubModels(
  messages: AIMessage[],
  maxTokens: number
): Promise<string | null> {
  if (!GM_TOKEN) return null
  try {
    const response = await fetch(`${GM_ENDPOINT}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GM_TOKEN}`,
      },
      body: JSON.stringify({
        model: GM_MODEL,
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

async function completeOpenRouter(
  messages: AIMessage[],
  maxTokens: number
): Promise<string | null> {
  if (!OR_KEY) return null
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OR_KEY}`,
      'X-Title': OR_APP_NAME,
    }
    if (OR_SITE_URL) headers['HTTP-Referer'] = OR_SITE_URL
    const response = await fetch(`${OR_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: OR_MODEL,
        messages,
        max_tokens: maxTokens,
        temperature: 0.7,
      }),
    })
    if (!response.ok) {
      const body = await response.text()
      console.error('OpenRouter API error:', response.status, body)
      return null
    }
    const data = await response.json()
    return (data.choices?.[0]?.message?.content as string) ?? null
  } catch (error) {
    console.error('OpenRouter AI error:', error)
    return null
  }
}

async function completeCerebras(
  messages: AIMessage[],
  maxTokens: number
): Promise<string | null> {
  if (!CB_KEY) return null
  try {
    const response = await fetch(`${CB_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${CB_KEY}`,
      },
      body: JSON.stringify({
        model: CB_MODEL,
        messages,
        max_tokens: maxTokens,
        temperature: 0.7,
      }),
    })
    if (!response.ok) {
      const body = await response.text()
      console.error('Cerebras API error:', response.status, body)
      return null
    }
    const data = await response.json()
    return (data.choices?.[0]?.message?.content as string) ?? null
  } catch (error) {
    console.error('Cerebras AI error:', error)
    return null
  }
}

/**
 * Send a chat completion request to the configured AI provider.
 * Returns the assistant's reply text, or null on error / when AI is disabled.
 */
export async function aiComplete(
  messages: AIMessage[],
  maxTokens = 500
): Promise<string | null> {
  const provider = resolveProvider()
  if (!provider) return null

  switch (provider) {
    case 'github_models':
      return completeGitHubModels(messages, maxTokens)
    case 'openrouter':
      return completeOpenRouter(messages, maxTokens)
    case 'cerebras':
      return completeCerebras(messages, maxTokens)
    default:
      return null
  }
}
