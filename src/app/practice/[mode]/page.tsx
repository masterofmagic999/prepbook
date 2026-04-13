'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { useUserId } from '@/lib/hooks'
import { CheckCircle, XCircle, ArrowRight, RotateCcw } from 'lucide-react'

interface Question {
  id: string
  type: string
  prompt: string
  choices?: string | null
  correctAnswer?: string | null
  explanation?: string | null
  historicalThinkingSkill: string
  difficulty: number
  unit?: { name: string; number: number }
}

type Phase = 'answering' | 'feedback' | 'complete'

export default function PracticeModePage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const { userId, loading } = useUserId()

  const mode = params.mode as string
  const unitId = searchParams.get('unit') ?? 'all'

  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [phase, setPhase] = useState<Phase>('answering')
  const [selectedAnswer, setSelectedAnswer] = useState<string>('')
  const [saqResponse, setSaqResponse] = useState('')
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [dataLoading, setDataLoading] = useState(true)
  const [results, setResults] = useState<{ correct: number; total: number }>({ correct: 0, total: 0 })
  const [startTime, setStartTime] = useState<number>(Date.now())

  const questionType = mode.toUpperCase()

  useEffect(() => {
    if (loading) return
    if (!userId) { router.replace('/onboarding'); return }

    fetch(`/api/questions?type=${questionType}&unitId=${unitId}&limit=10`)
      .then(r => r.json())
      .then(data => {
        setQuestions(Array.isArray(data) ? data : [])
        setDataLoading(false)
        setStartTime(Date.now())
      })
      .catch(() => setDataLoading(false))
  }, [userId, loading, router, questionType, unitId])

  const currentQuestion = questions[currentIdx]
  const choices: string[] = currentQuestion?.choices ? JSON.parse(currentQuestion.choices) : []

  const handleMCQSubmit = useCallback(async () => {
    if (!currentQuestion || !userId) return
    const correct = selectedAnswer === currentQuestion.correctAnswer
    setIsCorrect(correct)
    setPhase('feedback')
    setResults(r => ({ correct: r.correct + (correct ? 1 : 0), total: r.total + 1 }))

    await fetch('/api/attempts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
      body: JSON.stringify({
        questionId: currentQuestion.id,
        response: selectedAnswer,
        isCorrect: correct,
        timeSpentSeconds: Math.round((Date.now() - startTime) / 1000),
      }),
    })
  }, [currentQuestion, userId, selectedAnswer, startTime])

  const handleSAQSubmit = useCallback(async () => {
    if (!currentQuestion || !userId) return
    setPhase('feedback')
    setResults(r => ({ ...r, total: r.total + 1 }))

    await fetch('/api/attempts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
      body: JSON.stringify({
        questionId: currentQuestion.id,
        response: saqResponse,
        timeSpentSeconds: Math.round((Date.now() - startTime) / 1000),
      }),
    })
  }, [currentQuestion, userId, saqResponse, startTime])

  function handleNext() {
    if (currentIdx >= questions.length - 1) {
      setPhase('complete')
    } else {
      setCurrentIdx(i => i + 1)
      setPhase('answering')
      setSelectedAnswer('')
      setSaqResponse('')
      setIsCorrect(null)
      setStartTime(Date.now())
    }
  }

  if (loading || dataLoading) {
    return <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
    </div>
  }

  if (questions.length === 0) {
    return (
      <div className="p-6 max-w-2xl mx-auto text-center py-16">
        <p className="text-gray-500 mb-4">No questions found for this selection.</p>
        <button onClick={() => router.back()} className="text-indigo-600 hover:underline">
          ← Go back
        </button>
      </div>
    )
  }

  if (phase === 'complete') {
    const pct = results.total > 0 ? Math.round((results.correct / results.total) * 100) : 0
    return (
      <div className="p-6 max-w-xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="text-5xl mb-4">{pct >= 70 ? '🎉' : pct >= 50 ? '💪' : '📚'}</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Session Complete!</h2>
          {mode === 'mcq' ? (
            <>
              <p className="text-4xl font-bold text-indigo-600 mb-1">{pct}%</p>
              <p className="text-gray-500">{results.correct} / {results.total} correct</p>
            </>
          ) : (
            <p className="text-gray-500">{results.total} questions answered</p>
          )}
          <div className="flex gap-3 mt-8 justify-center">
            <button
              onClick={() => router.push('/practice')}
              className="flex items-center gap-2 border border-gray-300 px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              <RotateCcw className="w-4 h-4" /> New Session
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
            >
              Dashboard <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Progress */}
      <div className="flex items-center gap-2 mb-6">
        <div className="flex-1 bg-gray-200 rounded-full h-2">
          <div
            className="bg-indigo-600 h-2 rounded-full transition-all"
            style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
          />
        </div>
        <span className="text-sm text-gray-500 shrink-0">{currentIdx + 1} / {questions.length}</span>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        {/* Meta */}
        <div className="flex gap-2 mb-4">
          <span className="text-xs font-medium px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full">
            {currentQuestion.type}
          </span>
          <span className="text-xs font-medium px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
            {currentQuestion.historicalThinkingSkill}
          </span>
          {currentQuestion.unit && (
            <span className="text-xs font-medium px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
              Unit {currentQuestion.unit.number}
            </span>
          )}
        </div>

        {/* Prompt */}
        <p className="text-gray-900 font-medium mb-6 leading-relaxed">{currentQuestion.prompt}</p>

        {/* MCQ choices */}
        {mode === 'mcq' && phase === 'answering' && (
          <div className="space-y-2">
            {choices.map((choice, i) => (
              <button
                key={i}
                onClick={() => setSelectedAnswer(choice)}
                className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                  selectedAnswer === choice
                    ? 'bg-indigo-50 border-indigo-400 text-indigo-900'
                    : 'border-gray-200 hover:border-indigo-200 text-gray-700'
                }`}
              >
                <span className="font-medium mr-2">{String.fromCharCode(65 + i)}.</span>
                {choice}
              </button>
            ))}
            <button
              onClick={handleMCQSubmit}
              disabled={!selectedAnswer}
              className="mt-4 w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              Submit Answer
            </button>
          </div>
        )}

        {/* MCQ feedback */}
        {mode === 'mcq' && phase === 'feedback' && (
          <div>
            <div className="space-y-2 mb-4">
              {choices.map((choice, i) => {
                const isThis = choice === selectedAnswer
                const isRight = choice === currentQuestion.correctAnswer
                let cls = 'border-gray-200 text-gray-700'
                if (isRight) cls = 'border-green-400 bg-green-50 text-green-900'
                else if (isThis && !isRight) cls = 'border-red-400 bg-red-50 text-red-900'
                return (
                  <div key={i} className={`flex items-center gap-2 px-4 py-3 rounded-lg border ${cls}`}>
                    {isRight ? <CheckCircle className="w-4 h-4 text-green-600 shrink-0" /> :
                      isThis ? <XCircle className="w-4 h-4 text-red-600 shrink-0" /> :
                      <span className="w-4 h-4 shrink-0" />}
                    <span className="font-medium mr-1">{String.fromCharCode(65 + i)}.</span>
                    {choice}
                  </div>
                )
              })}
            </div>
            {currentQuestion.explanation && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm font-medium text-blue-800 mb-1">Explanation</p>
                <p className="text-sm text-blue-700">{currentQuestion.explanation}</p>
              </div>
            )}
            <button onClick={handleNext} className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 flex items-center justify-center gap-2">
              {currentIdx >= questions.length - 1 ? 'See Results' : 'Next Question'} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* SAQ */}
        {mode === 'saq' && phase === 'answering' && (
          <div>
            <textarea
              value={saqResponse}
              onChange={e => setSaqResponse(e.target.value)}
              placeholder="Write your response here. Be specific and use evidence from what you've studied..."
              rows={6}
              className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none text-sm"
            />
            <div className="flex justify-between items-center mt-2 mb-4">
              <span className="text-xs text-gray-400">{saqResponse.trim().split(/\s+/).filter(Boolean).length} words</span>
            </div>
            <button
              onClick={handleSAQSubmit}
              disabled={saqResponse.trim().length < 10}
              className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              Submit Response
            </button>
          </div>
        )}

        {/* SAQ feedback */}
        {mode === 'saq' && phase === 'feedback' && (
          <div>
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Your Response:</p>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{saqResponse}</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm font-medium text-blue-800 mb-1">💡 AP Tip</p>
              <p className="text-sm text-blue-700">
                Strong SAQ responses identify a specific piece of evidence and clearly explain how it addresses the prompt. Aim for 3-4 sentences per part.
              </p>
            </div>
            <button onClick={handleNext} className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 flex items-center justify-center gap-2">
              {currentIdx >= questions.length - 1 ? 'See Results' : 'Next Question'} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
