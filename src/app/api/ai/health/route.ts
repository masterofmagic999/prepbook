import { NextResponse } from 'next/server'

// ── Re-read env vars at request time so hot-reload picks up changes ───────────
function getProviderConfig() {
  const GM_TOKEN = process.env.GITHUB_MODELS_TOKEN
  const GM_ENDPOINT =
    process.env.GITHUB_MODELS_ENDPOINT ?? 'https://models.inference.ai.azure.com'
  const GM_MODEL = process.env.GITHUB_MODELS_MODEL ?? 'gpt-4o-mini'

  const OR_KEY = process.env.OPENROUTER_API_KEY
  const OR_MODEL =
    process.env.OPENROUTER_MODEL ?? 'meta-llama/llama-3.1-8b-instruct:free'
  const OR_BASE_URL = process.env.OPENROUTER_BASE_URL ?? 'https://openrouter.ai/api/v1'

  const CB_KEY = process.env.CEREBRAS_API_KEY
  const CB_MODEL = process.env.CEREBRAS_MODEL ?? 'llama3.1-8b'
  const CB_BASE_URL = process.env.CEREBRAS_BASE_URL ?? 'https://api.cerebras.ai/v1'

  const explicit = process.env.AI_PROVIDER?.toLowerCase()

  let provider: 'github_models' | 'openrouter' | 'cerebras' | null = null
  let model = ''
  let baseUrl = ''
  let hasKey = false

  if (explicit === 'github_models' || (!explicit && GM_TOKEN)) {
    provider = 'github_models'
    model = GM_MODEL
    baseUrl = GM_ENDPOINT
    hasKey = !!GM_TOKEN
  } else if (explicit === 'openrouter' || (!explicit && !GM_TOKEN && OR_KEY)) {
    provider = 'openrouter'
    model = OR_MODEL
    baseUrl = OR_BASE_URL
    hasKey = !!OR_KEY
  } else if (explicit === 'cerebras' || (!explicit && !GM_TOKEN && !OR_KEY && CB_KEY)) {
    provider = 'cerebras'
    model = CB_MODEL
    baseUrl = CB_BASE_URL
    hasKey = !!CB_KEY
  } else if (explicit && explicit !== 'fallback') {
    // Explicit provider set but no matching key
    provider = explicit as 'github_models' | 'openrouter' | 'cerebras'
    if (explicit === 'github_models') { model = GM_MODEL; baseUrl = GM_ENDPOINT }
    else if (explicit === 'openrouter') { model = OR_MODEL; baseUrl = OR_BASE_URL }
    else if (explicit === 'cerebras') { model = CB_MODEL; baseUrl = CB_BASE_URL }
    hasKey = false
  }

  return { provider, model, baseUrl, hasKey, GM_TOKEN, OR_KEY, CB_KEY, GM_ENDPOINT, GM_MODEL, OR_BASE_URL, OR_MODEL, CB_BASE_URL, CB_MODEL }
}

type PingResult = {
  ok: boolean
  latencyMs: number | null
  error: string | null
}

async function pingProvider(config: ReturnType<typeof getProviderConfig>): Promise<PingResult> {
  const { provider, GM_TOKEN, GM_ENDPOINT, GM_MODEL, OR_KEY, OR_BASE_URL, OR_MODEL, CB_KEY, CB_BASE_URL, CB_MODEL } = config
  const pingMessages = [{ role: 'user' as const, content: 'Reply with exactly the word: OK' }]
  const start = Date.now()

  try {
    let url: string
    let headers: Record<string, string>
    let body: string

    if (provider === 'github_models') {
      if (!GM_TOKEN) return { ok: false, latencyMs: null, error: 'GITHUB_MODELS_TOKEN not set' }
      url = `${GM_ENDPOINT}/chat/completions`
      headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${GM_TOKEN}` }
      body = JSON.stringify({ model: GM_MODEL, messages: pingMessages, max_tokens: 5 })
    } else if (provider === 'openrouter') {
      if (!OR_KEY) return { ok: false, latencyMs: null, error: 'OPENROUTER_API_KEY not set' }
      url = `${OR_BASE_URL}/chat/completions`
      headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${OR_KEY}` }
      body = JSON.stringify({ model: OR_MODEL, messages: pingMessages, max_tokens: 5 })
    } else if (provider === 'cerebras') {
      if (!CB_KEY) return { ok: false, latencyMs: null, error: 'CEREBRAS_API_KEY not set' }
      url = `${CB_BASE_URL}/chat/completions`
      headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${CB_KEY}` }
      body = JSON.stringify({ model: CB_MODEL, messages: pingMessages, max_tokens: 5 })
    } else {
      return { ok: false, latencyMs: null, error: 'No AI provider configured' }
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10_000)

    let response: Response
    try {
      response = await fetch(url, { method: 'POST', headers, body, signal: controller.signal })
    } finally {
      clearTimeout(timeoutId)
    }

    const latencyMs = Date.now() - start

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      return {
        ok: false,
        latencyMs,
        error: mapHttpError(response.status, text),
      }
    }

    return { ok: true, latencyMs, error: null }
  } catch (err: unknown) {
    const latencyMs = Date.now() - start
    if (err instanceof Error && err.name === 'AbortError') {
      return { ok: false, latencyMs, error: 'Request timed out after 10 s' }
    }
    const message = err instanceof Error ? err.message : String(err)
    if (message.toLowerCase().includes('fetch failed') || message.toLowerCase().includes('enotfound')) {
      return { ok: false, latencyMs, error: 'Network error — cannot reach provider endpoint' }
    }
    return { ok: false, latencyMs, error: `Unexpected error: ${message}` }
  }
}

function mapHttpError(status: number, body: string): string {
  if (status === 401 || status === 403) return 'Unauthorized — API key is invalid or expired'
  if (status === 404) return 'Model not found — check model name in .env.local'
  if (status === 429) return 'Rate limit exceeded — free-tier quota hit; wait or switch models'
  if (status >= 500) return `Provider server error (${status}) — try again later`
  const snippet = body.slice(0, 200)
  return `HTTP ${status}: ${snippet || 'unknown error'}`
}

/**
 * GET /api/ai/health
 *
 * Returns AI provider status without exposing secrets.
 * Query param: ?ping=1 to run a live test completion.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const runPing = searchParams.get('ping') === '1'

  const config = getProviderConfig()
  const { provider, model, hasKey } = config

  const base = {
    provider: provider ?? 'fallback',
    model: provider ? model : null,
    hasKey,
    aiEnabled: provider !== null && hasKey,
    checkedAt: new Date().toISOString(),
  }

  if (!runPing) {
    return NextResponse.json({ ...base, ping: null })
  }

  const ping = await pingProvider(config)

  return NextResponse.json({ ...base, ping })
}
