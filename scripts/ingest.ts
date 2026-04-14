#!/usr/bin/env ts-node
/**
 * PrepBook — Study Materials Ingestion Script
 *
 * Reads source files from the `materials/` folder and generates tagged
 * MCQ + SAQ question drafts saved to `data/questions.json`.
 *
 * Usage:
 *   npm run ingest
 *   # or with AI:
 *   AI_PROVIDER=cerebras CEREBRAS_API_KEY=<key> npm run ingest
 *
 * Source files: place .txt / .md files in the materials/ folder.
 * Output: data/questions.json
 */

import * as fs from 'fs'
import * as path from 'path'

// ── Types ─────────────────────────────────────────────────────────────────────

interface GeneratedQuestion {
  type: 'MCQ' | 'SAQ'
  prompt: string
  choices: string[] | null        // MCQ only; null for SAQ
  correctAnswer: string | null    // MCQ only; null for SAQ
  explanation: string
  unit: number | null             // AP World History unit 1–9
  skill: string                   // e.g. "causation", "continuity_and_change", "comparison"
  difficulty: 1 | 2 | 3 | 4 | 5
  timePeriod: string              // e.g. "1200-1450"
  sourceFile: string
  sourceChunk: string
}

// ── AP World History metadata ─────────────────────────────────────────────────

const UNIT_PERIODS: Record<number, string> = {
  1: '1200-1450',
  2: '1200-1450',
  3: '1450-1750',
  4: '1450-1750',
  5: '1750-1900',
  6: '1750-1900',
  7: '1900-1945',
  8: '1945-1980',
  9: '1980-present',
}

const UNIT_NAMES: Record<number, string> = {
  1: 'The Global Tapestry',
  2: 'Networks of Exchange',
  3: 'Land-Based Empires',
  4: 'Transoceanic Interconnections',
  5: 'Revolutions',
  6: 'Consequences of Industrialization',
  7: 'Global Conflict',
  8: 'Cold War and Decolonization',
  9: 'Globalization',
}

// ── File helpers ──────────────────────────────────────────────────────────────

function readMaterialsDir(dir: string): Array<{ file: string; content: string }> {
  if (!fs.existsSync(dir)) {
    console.error(`[ingest] materials/ folder not found at: ${dir}`)
    console.error('[ingest] Create it and add .txt or .md files, then re-run.')
    process.exit(1)
  }

  const files = fs.readdirSync(dir).filter(f => {
    if (!/\.(txt|md)$/i.test(f)) return false
    // Skip documentation files in the materials folder itself
    if (/^readme\.(txt|md)$/i.test(f)) return false
    return true
  })
  if (files.length === 0) {
    console.warn('[ingest] No .txt or .md files found in materials/. Nothing to process.')
    return []
  }

  return files.map(file => ({
    file,
    content: fs.readFileSync(path.join(dir, file), 'utf8'),
  }))
}

function chunkText(text: string, maxChars = 1500): string[] {
  const paragraphs = text.split(/\n{2,}/).map(p => p.trim()).filter(Boolean)
  const chunks: string[] = []
  let current = ''

  for (const para of paragraphs) {
    if (current.length + para.length > maxChars && current.length > 0) {
      chunks.push(current.trim())
      current = ''
    }
    current += (current ? '\n\n' : '') + para
  }
  if (current.trim()) chunks.push(current.trim())
  return chunks
}

// ── Unit/period detection ─────────────────────────────────────────────────────

function detectUnit(text: string): number | null {
  // Look for explicit unit mentions
  const unitMatch = text.match(/unit\s+([1-9])/i)
  if (unitMatch) return parseInt(unitMatch[1])

  // Heuristic: look for year ranges matching 1200–2029
  const years = text.match(/\b(1[2-9]\d{2}|20[0-2]\d)\b/g)?.map(Number) ?? []
  if (years.length === 0) return null

  const avg = years.reduce((a, b) => a + b, 0) / years.length
  // Use <= 1450 so that years right at the 1200-1450 boundary map to Unit 2
  if (avg <= 1450) return 2   // Networks of Exchange (1200-1450)
  if (avg <= 1750) return 4   // Transoceanic Interconnections (1450-1750)
  if (avg <= 1900) return 6   // Consequences of Industrialization (1750-1900)
  if (avg <= 1945) return 7   // Global Conflict (1900-1945)
  if (avg <= 1980) return 8   // Cold War and Decolonization (1945-1980)
  return 9                    // Globalization (1980-present)
}

function detectSkill(text: string): string {
  const lower = text.toLowerCase()
  if (/\bcause|effect|result|led to|because\b/.test(lower)) return 'causation'
  if (/\bchange|continuity|over time|shift|evolv\b/.test(lower)) return 'continuity_and_change'
  if (/\bsimilar|differ|compare|contrast|both|whereas\b/.test(lower)) return 'comparison'
  if (/\bcontext|background|broader|global\b/.test(lower)) return 'contextualization'
  return 'argumentation'
}

// ── Validation ────────────────────────────────────────────────────────────────

function validateQuestion(q: unknown, index: number): GeneratedQuestion {
  if (typeof q !== 'object' || q === null) {
    throw new Error(`Item ${index}: not an object`)
  }
  const item = q as Record<string, unknown>

  const type = item.type
  if (type !== 'MCQ' && type !== 'SAQ') {
    throw new Error(`Item ${index}: type must be "MCQ" or "SAQ", got ${JSON.stringify(type)}`)
  }

  if (typeof item.prompt !== 'string' || item.prompt.trim().length < 10) {
    throw new Error(`Item ${index}: prompt must be a non-empty string (min 10 chars)`)
  }

  if (type === 'MCQ') {
    if (!Array.isArray(item.choices) || item.choices.length < 2) {
      throw new Error(`Item ${index}: MCQ must have at least 2 choices`)
    }
    if (typeof item.correctAnswer !== 'string' || !item.correctAnswer.trim()) {
      throw new Error(`Item ${index}: MCQ must have a non-empty correctAnswer`)
    }
  }

  if (typeof item.explanation !== 'string' || item.explanation.trim().length < 5) {
    throw new Error(`Item ${index}: explanation must be a non-empty string`)
  }

  const difficulty = Number(item.difficulty)
  if (!Number.isInteger(difficulty) || difficulty < 1 || difficulty > 5) {
    throw new Error(`Item ${index}: difficulty must be an integer 1–5, got ${item.difficulty}`)
  }

  return {
    type: type as 'MCQ' | 'SAQ',
    prompt: String(item.prompt).trim(),
    choices: type === 'MCQ' ? (item.choices as string[]).map(String) : null,
    correctAnswer: type === 'MCQ' ? String(item.correctAnswer).trim() : null,
    explanation: String(item.explanation).trim(),
    unit: item.unit != null ? Number(item.unit) : null,
    skill: typeof item.skill === 'string' ? item.skill : 'argumentation',
    difficulty: difficulty as 1 | 2 | 3 | 4 | 5,
    timePeriod: typeof item.timePeriod === 'string' ? item.timePeriod : (item.unit ? UNIT_PERIODS[Number(item.unit)] ?? 'unknown' : 'unknown'),
    sourceFile: typeof item.sourceFile === 'string' ? item.sourceFile : '',
    sourceChunk: typeof item.sourceChunk === 'string' ? item.sourceChunk : '',
  }
}

// ── Deterministic question generation ────────────────────────────────────────

function deterministicMCQ(chunk: string, sourceFile: string): GeneratedQuestion {
  const unit = detectUnit(chunk)
  const skill = detectSkill(chunk)
  // Extract a meaningful sentence for the prompt
  const sentences = chunk.split(/(?<=[.!?])\s+/).filter(s => s.length > 30)
  const keySentence = sentences[0] ?? chunk.slice(0, 200)

  return {
    type: 'MCQ',
    prompt: `Based on the following passage, which statement best describes the historical significance?\n\n"${keySentence.slice(0, 200)}"`,
    choices: [
      'A) It illustrates the spread of trade networks across regions.',
      'B) It demonstrates the decline of centralized empires.',
      'C) It reflects religious and cultural exchange between civilizations.',
      'D) It shows the impact of technological innovation on society.',
    ],
    correctAnswer: 'A) It illustrates the spread of trade networks across regions.',
    explanation: `This passage relates to ${unit ? UNIT_NAMES[unit] : 'AP World History'} and demonstrates key themes of ${skill}. Review the passage for specific evidence.`,
    unit,
    skill,
    difficulty: 2,
    timePeriod: unit ? UNIT_PERIODS[unit] : 'unknown',
    sourceFile,
    sourceChunk: chunk.slice(0, 300),
  }
}

function deterministicSAQ(chunk: string, sourceFile: string): GeneratedQuestion {
  const unit = detectUnit(chunk)
  const skill = detectSkill(chunk)

  return {
    type: 'SAQ',
    prompt: `Using specific evidence from your knowledge of AP World History, answer the following:\n\na) Identify ONE historical development described in the following excerpt.\nb) Explain ONE cause of this development.\nc) Explain ONE effect of this development.\n\nExcerpt: "${chunk.slice(0, 300)}"`,
    choices: null,
    correctAnswer: null,
    explanation: `Strong responses will identify a specific development in ${unit ? UNIT_NAMES[unit] : 'AP World History'}, provide a historically grounded cause, and connect the development to broader effects. Use precise terminology.`,
    unit,
    skill,
    difficulty: 3,
    timePeriod: unit ? UNIT_PERIODS[unit] : 'unknown',
    sourceFile,
    sourceChunk: chunk.slice(0, 300),
  }
}

// ── AI-enhanced question generation ──────────────────────────────────────────

async function aiGenerateQuestions(
  chunk: string,
  sourceFile: string
): Promise<GeneratedQuestion[]> {
  // Dynamically require AI module to avoid loading it when AI is disabled
  // (ts-node will compile it on demand)
  let aiComplete: ((messages: Array<{role: string; content: string}>, maxTokens?: number) => Promise<string | null>) | null = null
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const aiModule = require('../src/lib/ai')
    if (!aiModule.isAIEnabled()) return []
    aiComplete = aiModule.aiComplete
  } catch {
    return []
  }

  if (!aiComplete) return []

  const prompt = `You are an AP World History question writer. Given the following source excerpt, generate ONE MCQ question and ONE SAQ question.

Return ONLY a JSON array (no markdown, no explanation) with exactly 2 objects in this schema:
[
  {
    "type": "MCQ",
    "prompt": "<question>",
    "choices": ["A) ...", "B) ...", "C) ...", "D) ..."],
    "correctAnswer": "A) ...",
    "explanation": "<why correct>",
    "unit": <1-9 or null>,
    "skill": "<causation|continuity_and_change|comparison|contextualization|argumentation>",
    "difficulty": <1-5>,
    "timePeriod": "<e.g. 1200-1450>"
  },
  {
    "type": "SAQ",
    "prompt": "<question with a/b/c parts>",
    "choices": null,
    "correctAnswer": null,
    "explanation": "<grading guidance>",
    "unit": <1-9 or null>,
    "skill": "<skill>",
    "difficulty": <1-5>,
    "timePeriod": "<e.g. 1450-1750>"
  }
]

Source excerpt:
${chunk.slice(0, 1200)}`

  try {
    const raw = await aiComplete([{ role: 'user', content: prompt }], 800)
    if (!raw) return []

    // Extract JSON array from response
    const jsonMatch = raw.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      console.warn('[ingest] AI response did not contain a JSON array, skipping chunk')
      return []
    }

    const parsed: unknown[] = JSON.parse(jsonMatch[0])
    if (!Array.isArray(parsed)) return []

    return parsed.map((item, i) => {
      const q = validateQuestion(item, i)
      q.sourceFile = sourceFile
      q.sourceChunk = chunk.slice(0, 300)
      return q
    })
  } catch (err) {
    console.warn('[ingest] AI generation failed for chunk:', (err as Error).message)
    return []
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const repoRoot = path.resolve(__dirname, '..')
  const materialsDir = path.join(repoRoot, 'materials')
  const outputFile = path.join(repoRoot, 'data', 'questions.json')

  console.log('[ingest] Reading materials from:', materialsDir)

  const sources = readMaterialsDir(materialsDir)
  if (sources.length === 0) process.exit(0)

  // Detect AI availability
  let aiEnabled = false
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const aiModule = require('../src/lib/ai')
    aiEnabled = aiModule.isAIEnabled()
  } catch {
    aiEnabled = false
  }

  console.log(`[ingest] AI mode: ${aiEnabled ? 'enabled' : 'disabled (deterministic fallback)'}`)
  console.log(`[ingest] Processing ${sources.length} file(s)…`)

  const allQuestions: GeneratedQuestion[] = []
  let errorCount = 0

  for (const { file, content } of sources) {
    console.log(`[ingest]   → ${file}`)
    const chunks = chunkText(content)

    for (const chunk of chunks) {
      if (aiEnabled) {
        try {
          const aiQuestions = await aiGenerateQuestions(chunk, file)
          if (aiQuestions.length > 0) {
            allQuestions.push(...aiQuestions)
            continue
          }
        } catch (err) {
          console.warn(`[ingest] AI error for ${file}:`, (err as Error).message)
          errorCount++
        }
      }

      // Deterministic fallback
      try {
        allQuestions.push(deterministicMCQ(chunk, file))
        allQuestions.push(deterministicSAQ(chunk, file))
      } catch (err) {
        console.error(`[ingest] Validation error for ${file}:`, (err as Error).message)
        errorCount++
      }
    }
  }

  // Ensure output dir exists
  const dataDir = path.dirname(outputFile)
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })

  // Write output
  fs.writeFileSync(outputFile, JSON.stringify(allQuestions, null, 2), 'utf8')

  console.log(`\n[ingest] ✓ Generated ${allQuestions.length} question(s) → ${outputFile}`)
  if (errorCount > 0) {
    console.warn(`[ingest] ⚠ ${errorCount} chunk(s) had errors and were skipped`)
  }
}

main().catch(err => {
  console.error('[ingest] Fatal error:', err)
  process.exit(1)
})
