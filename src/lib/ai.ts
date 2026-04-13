/**
 * AI provider adapter for PrepBook.
 *
 * Supports GitHub Models (OpenAI-compatible API) with automatic fallback to
 * deterministic text when credentials are absent or the API is unavailable.
 *
 * Environment variables (all optional):
 *   GITHUB_TOKEN            – PAT or Codespaces token with `models:read` scope.
 *                             In GitHub Codespaces this is injected automatically.
 *   GITHUB_MODELS_MODEL     – Model ID to use (default: "gpt-4o-mini").
 *   GITHUB_MODELS_BASE_URL  – Override the inference endpoint
 *                             (default: "https://models.inference.ai.azure.com").
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface AIProvider {
  /** Generate an enriched planner task description. */
  generatePlannerNote(
    type: string,
    unitName: string,
    isFinalPhase: boolean
  ): Promise<string>

  /** Generate criterion-level writing feedback for a submission. */
  generateWritingFeedback(params: {
    questionType: string
    prompt: string
    draft: string
    criterionName: string
    maxPoints: number
  }): Promise<{ score: number; feedback: string }>

  /** True when backed by a real model; false when using fallback logic. */
  readonly isLive: boolean
}

// ---------------------------------------------------------------------------
// GitHub Models provider
// ---------------------------------------------------------------------------

const DEFAULT_MODEL = 'gpt-4o-mini'
const DEFAULT_BASE_URL = 'https://models.inference.ai.azure.com'

async function chatCompletion(
  messages: ChatMessage[],
  token: string,
  model: string,
  baseUrl: string
): Promise<string> {
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: 300,
      temperature: 0.5,
    }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`GitHub Models API error ${res.status}: ${text}`)
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>
  }
  return data.choices?.[0]?.message?.content?.trim() ?? ''
}

class GitHubModelsProvider implements AIProvider {
  readonly isLive = true
  private token: string
  private model: string
  private baseUrl: string

  constructor(token: string, model: string, baseUrl: string) {
    this.token = token
    this.model = model
    this.baseUrl = baseUrl
  }

  async generatePlannerNote(
    type: string,
    unitName: string,
    isFinalPhase: boolean
  ): Promise<string> {
    const phase = isFinalPhase ? 'final exam review phase' : 'regular study phase'
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content:
          'You are a concise AP World History study coach. Write a 1–2 sentence study task description. Be specific, actionable, and encouraging. Do not include greetings or sign-offs.',
      },
      {
        role: 'user',
        content: `Write a task description for a ${type} practice session on "${unitName}" during the ${phase}. Keep it under 40 words.`,
      },
    ]
    return chatCompletion(messages, this.token, this.model, this.baseUrl)
  }

  async generateWritingFeedback(params: {
    questionType: string
    prompt: string
    draft: string
    criterionName: string
    maxPoints: number
  }): Promise<{ score: number; feedback: string }> {
    const { questionType, prompt, draft, criterionName, maxPoints } = params
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content:
          'You are a strict AP World History grader. Return ONLY valid JSON with keys "score" (integer) and "feedback" (string, ≤ 40 words). No extra text.',
      },
      {
        role: 'user',
        content: `Grade this ${questionType} draft for the rubric criterion "${criterionName}" (max ${maxPoints} point${maxPoints > 1 ? 's' : ''}).

Prompt: ${prompt.slice(0, 300)}

Draft excerpt: ${draft.slice(0, 600)}

Return JSON: {"score": <0 to ${maxPoints}>, "feedback": "<concise feedback>"}`,
      },
    ]
    const raw = await chatCompletion(messages, this.token, this.model, this.baseUrl)

    // Parse JSON safely; fall back to 0/no-feedback if malformed
    try {
      const parsed = JSON.parse(raw) as { score?: number; feedback?: string }
      const score = Math.min(
        maxPoints,
        Math.max(0, Math.round(Number(parsed.score ?? 0)))
      )
      const feedback = (parsed.feedback ?? '').slice(0, 200)
      return { score, feedback }
    } catch {
      return { score: 0, feedback: 'AI feedback unavailable — please review manually.' }
    }
  }
}

// ---------------------------------------------------------------------------
// Fallback provider
// ---------------------------------------------------------------------------

class FallbackProvider implements AIProvider {
  readonly isLive = false

  async generatePlannerNote(
    type: string,
    unitName: string,
    isFinalPhase: boolean
  ): Promise<string> {
    const prefix = isFinalPhase ? 'Final review: ' : ''
    switch (type) {
      case 'MCQ':
        return `${prefix}Practice multiple choice questions on ${unitName}. Focus on key concepts and cause-and-effect relationships.`
      case 'SAQ':
        return `${prefix}Practice short answer questions on ${unitName}. Write concise, specific responses with evidence.`
      case 'DBQ':
        return `${prefix}Work on a document-based question related to ${unitName}. Practice sourcing, contextualization, and evidence.`
      case 'LEQ':
        return `${prefix}Practice a long essay question for ${unitName}. Focus on thesis, contextualization, and supporting evidence.`
      case 'REVIEW':
        return `Review key terms and patterns in ${unitName}. Use flashcards or notes to reinforce memory.`
      case 'MIXED':
        return `${prefix}Mixed practice session on ${unitName}. Combine MCQ and writing to simulate exam conditions.`
      default:
        return `Study session for ${unitName}.`
    }
  }

  async generateWritingFeedback(params: {
    questionType: string
    prompt: string
    draft: string
    criterionName: string
    maxPoints: number
  }): Promise<{ score: number; feedback: string }> {
    const { criterionName, maxPoints, draft } = params
    const wordCount = draft.trim().split(/\s+/).filter(Boolean).length
    let score = 0

    if (criterionName.toLowerCase().includes('thesis') && wordCount > 50) score = 1
    else if (criterionName.toLowerCase().includes('evidence') && wordCount > 150)
      score = maxPoints >= 2 ? 1 : 0
    else if (criterionName.toLowerCase().includes('contextual') && wordCount > 100)
      score = 1

    const feedback =
      score > 0
        ? `Good work on ${criterionName.toLowerCase()}.`
        : `Consider strengthening your ${criterionName.toLowerCase()}.`
    return { score, feedback }
  }
}

// ---------------------------------------------------------------------------
// Factory — picks the right provider based on env vars
// ---------------------------------------------------------------------------

let _provider: AIProvider | null = null

/**
 * Returns the active AI provider.
 *
 * Uses GitHub Models when `GITHUB_TOKEN` is set; otherwise returns the
 * deterministic fallback so the app always works without credentials.
 *
 * Call this inside server-side code (API routes, server components) only.
 */
export function getAIProvider(): AIProvider {
  if (_provider) return _provider

  const token = process.env.GITHUB_TOKEN ?? ''
  const model = process.env.GITHUB_MODELS_MODEL ?? DEFAULT_MODEL
  const baseUrl = (process.env.GITHUB_MODELS_BASE_URL ?? DEFAULT_BASE_URL).replace(/\/$/, '')

  if (token) {
    _provider = new GitHubModelsProvider(token, model, baseUrl)
  } else {
    _provider = new FallbackProvider()
  }

  return _provider
}

/**
 * Reset the cached provider instance. Useful in tests.
 */
export function resetAIProvider(): void {
  _provider = null
}
