'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useUserId, useAutoSave } from '@/lib/hooks'
import { Clock, Save, CheckSquare, Send, ArrowLeft } from 'lucide-react'

interface RubricCriterion {
  id: string
  name: string
  description: string
  maxPoints: number
}

interface Submission {
  id: string
  content: string
  wordCount: number
  status: string
  timerSeconds: number | null
  question: {
    id: string
    type: string
    prompt: string
    stimulus: string | null
    unit: { name: string; number: number }
  }
  scores: Array<{
    id: string
    criterionName: string
    score: number
    maxScore: number
    feedback: string
  }>
}

export default function WorkspacePage() {
  const router = useRouter()
  const { submissionId } = useParams() as { submissionId: string }
  const { userId, loading } = useUserId()

  const [submission, setSubmission] = useState<Submission | null>(null)
  const [content, setContent] = useState('')
  const [dataLoading, setDataLoading] = useState(true)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [rubricCriteria, setRubricCriteria] = useState<RubricCriterion[]>([])
  const [checkedCriteria, setCheckedCriteria] = useState<Set<string>>(new Set())
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const saveStatus = useAutoSave(content, submissionId, userId)

  useEffect(() => {
    if (loading) return
    if (!userId) { router.replace('/onboarding'); return }

    fetch(`/api/submissions/${submissionId}`, {
      headers: { 'x-user-id': userId },
    })
      .then(r => r.json())
      .then(async (data: Submission) => {
        setSubmission(data)
        setContent(data.content ?? '')
        setSubmitted(data.status === 'FINAL')

        // Load rubric criteria from DB via rubric endpoint
        const qType = data.question.type
        setDataLoading(false)

        const rRes = await fetch(`/api/rubric?type=${qType}`)
        if (rRes.ok) {
          const r = await rRes.json()
          setRubricCriteria(r?.criteria ?? [])
        }
      })
      .catch(() => setDataLoading(false))
  }, [userId, loading, router, submissionId])

  // Timer
  useEffect(() => {
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  async function handleSubmit() {
    if (!userId || !submission) return
    setSubmitting(true)
    try {
      // Save latest content first
      await fetch(`/api/submissions/${submissionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
        body: JSON.stringify({
          content,
          wordCount: content.trim().split(/\s+/).filter(Boolean).length,
          timerSeconds: elapsed,
        }),
      })

      const res = await fetch(`/api/submissions/${submissionId}/submit`, {
        method: 'POST',
        headers: { 'x-user-id': userId },
      })
      const data: Submission = await res.json()
      setSubmission(data)
      setSubmitted(true)
      if (timerRef.current) clearInterval(timerRef.current)
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const getDefaultRubric = (type: string): RubricCriterion[] => {
    const base = [
      { id: 'r1', name: 'Thesis/Claim', description: 'Historically defensible thesis with a line of reasoning', maxPoints: 1 },
      { id: 'r2', name: 'Contextualization', description: 'Broader historical context connected to the argument', maxPoints: 1 },
    ]
    if (type === 'DBQ') {
      return [
        ...base,
        { id: 'r3', name: 'Document Evidence', description: 'Uses content of at least 3 documents (1pt) or 6 documents (2pts)', maxPoints: 2 },
        { id: 'r4', name: 'Outside Evidence', description: 'Evidence not found in documents', maxPoints: 1 },
        { id: 'r5', name: 'Sourcing', description: 'Explains POV, purpose, historical situation, or audience for 3 docs', maxPoints: 1 },
        { id: 'r6', name: 'Complexity', description: 'Demonstrates complex understanding', maxPoints: 1 },
      ]
    }
    return [
      ...base,
      { id: 'r3', name: 'Specific Evidence', description: 'At least 2 specific pieces of evidence', maxPoints: 2 },
      { id: 'r4', name: 'Historical Reasoning', description: 'Uses comparison, causation, or CCOT', maxPoints: 1 },
      { id: 'r5', name: 'Complexity', description: 'Demonstrates complex understanding', maxPoints: 1 },
    ]
  }

  const displayRubric = rubricCriteria.length > 0 ? rubricCriteria : getDefaultRubric(submission?.question?.type ?? 'LEQ')

  if (loading || dataLoading) {
    return <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
    </div>
  }

  if (!submission) {
    return <div className="p-6 text-center text-gray-500">Submission not found.</div>
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <p className="text-sm font-semibold text-gray-900">
              {submission.question.type} — Unit {submission.question.unit.number}: {submission.question.unit.name}
            </p>
            <p className="text-xs text-gray-400">{wordCount} words · {formatTime(elapsed)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Save className="w-3.5 h-3.5" />
            {saveStatus === 'saving' ? 'Saving...' :
             saveStatus === 'saved' ? 'Saved' :
             saveStatus === 'error' ? 'Save failed' : 'Unsaved'}
          </div>
          {!submitted && (
            <button
              onClick={handleSubmit}
              disabled={submitting || wordCount < 50}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {submitting ? 'Submitting...' : 'Submit'}
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Prompt */}
        <div className="w-1/3 border-r border-gray-200 overflow-y-auto bg-gray-50 p-4">
          <h3 className="font-semibold text-gray-900 mb-3 text-sm">Prompt</h3>
          <p className="text-sm text-gray-700 leading-relaxed mb-4">{submission.question.prompt}</p>

          {submission.question.stimulus && (
            <>
              <h3 className="font-semibold text-gray-900 mb-2 text-sm">Documents / Stimulus</h3>
              <div className="text-xs text-gray-600 bg-white border border-gray-200 rounded-lg p-3 whitespace-pre-wrap leading-relaxed">
                {submission.question.stimulus}
              </div>
            </>
          )}
        </div>

        {/* Center: Editor */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {submitted && submission.scores.length > 0 ? (
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-2xl mx-auto">
                <div className="flex items-center gap-2 mb-4">
                  <CheckSquare className="w-5 h-5 text-green-500" />
                  <h2 className="text-lg font-semibold text-gray-900">Submission Scored</h2>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <p className="text-sm font-medium text-gray-700 mb-2">Your Essay:</p>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{content}</p>
                </div>
                <h3 className="font-semibold text-gray-900 mb-3">Rubric Scores</h3>
                <div className="space-y-3">
                  {submission.scores.map((score) => (
                    <div key={score.id} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between mb-1">
                        <span className="font-medium text-sm text-gray-900">{score.criterionName}</span>
                        <span className={`text-sm font-bold ${score.score > 0 ? 'text-green-600' : 'text-red-500'}`}>
                          {score.score}/{score.maxScore}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">{score.feedback}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                  <p className="font-semibold text-indigo-900">
                    Total: {submission.scores.reduce((s, x) => s + x.score, 0)} / {submission.scores.reduce((s, x) => s + x.maxScore, 0)} points
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              disabled={submitted}
              placeholder="Begin writing your essay here. Start with a clear thesis statement..."
              className="flex-1 resize-none border-0 outline-none p-6 text-gray-800 text-sm leading-relaxed bg-white"
            />
          )}
        </div>

        {/* Right: Rubric */}
        <div className="w-64 border-l border-gray-200 overflow-y-auto bg-gray-50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <CheckSquare className="w-4 h-4 text-gray-500" />
            <h3 className="font-semibold text-gray-900 text-sm">Rubric Checklist</h3>
          </div>
          <div className="space-y-2">
            {displayRubric.map((criterion) => (
              <label
                key={criterion.id}
                className={`flex items-start gap-2 p-3 rounded-lg cursor-pointer border transition-colors ${
                  checkedCriteria.has(criterion.id)
                    ? 'bg-green-50 border-green-200'
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={checkedCriteria.has(criterion.id)}
                  onChange={(e) => {
                    const next = new Set(checkedCriteria)
                    if (e.target.checked) next.add(criterion.id)
                    else next.delete(criterion.id)
                    setCheckedCriteria(next)
                  }}
                  className="mt-0.5 accent-green-600"
                />
                <div>
                  <p className="text-xs font-medium text-gray-900">{criterion.name}</p>
                  <p className="text-xs text-gray-500">{criterion.description}</p>
                  <p className="text-xs text-indigo-600 mt-0.5">{criterion.maxPoints} pt{criterion.maxPoints > 1 ? 's' : ''}</p>
                </div>
              </label>
            ))}
          </div>
          <div className="mt-3 p-3 bg-indigo-50 rounded-lg">
            <p className="text-xs font-medium text-indigo-800">
              Self-check: {checkedCriteria.size} / {displayRubric.length} criteria
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
