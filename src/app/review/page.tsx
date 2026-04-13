'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useUserId } from '@/lib/hooks'
import { BarChart2, TrendingUp, RotateCcw, AlertCircle } from 'lucide-react'

interface MasteryItem {
  id: string
  unitId: string
  masteryScore: number
  totalAttempts: number
  correctAttempts: number
  unit: { number: number; name: string; timePeriod: string }
}

interface Attempt {
  id: string
  isCorrect: boolean | null
  response: string
  createdAt: string
  question: {
    id: string
    type: string
    prompt: string
    correctAnswer: string | null
    explanation: string | null
    unit: { number: number; name: string }
  }
}

export default function ReviewPage() {
  const router = useRouter()
  const { userId, loading } = useUserId()
  const [mastery, setMastery] = useState<MasteryItem[]>([])
  const [attempts, setAttempts] = useState<Attempt[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [activeUnit, setActiveUnit] = useState<string | null>(null)

  useEffect(() => {
    if (loading) return
    if (!userId) { router.replace('/onboarding'); return }

    Promise.all([
      fetch('/api/mastery', { headers: { 'x-user-id': userId } }).then(r => r.json()),
      fetch('/api/attempts?limit=100', { headers: { 'x-user-id': userId } }).then(r => r.json()),
    ]).then(([m, a]) => {
      setMastery(Array.isArray(m) ? m : [])
      setAttempts(Array.isArray(a) ? a : [])
      setDataLoading(false)
    }).catch(() => setDataLoading(false))
  }, [userId, loading, router])

  const getMasteryColor = (score: number) => {
    if (score >= 80) return 'bg-green-500'
    if (score >= 60) return 'bg-yellow-500'
    if (score >= 40) return 'bg-orange-500'
    return 'bg-red-500'
  }

  const getMasteryLabel = (score: number) => {
    if (score >= 80) return { label: 'Mastered', cls: 'text-green-600 bg-green-50' }
    if (score >= 60) return { label: 'Proficient', cls: 'text-yellow-600 bg-yellow-50' }
    if (score >= 40) return { label: 'Developing', cls: 'text-orange-600 bg-orange-50' }
    return { label: 'Needs Work', cls: 'text-red-600 bg-red-50' }
  }

  const incorrectAttempts = attempts.filter(a => a.isCorrect === false)
  const incorrectByUnit: Record<string, Attempt[]> = {}
  for (const a of incorrectAttempts) {
    const unitName = `Unit ${a.question.unit.number}: ${a.question.unit.name}`
    if (!incorrectByUnit[unitName]) incorrectByUnit[unitName] = []
    incorrectByUnit[unitName].push(a)
  }

  if (loading || dataLoading) {
    return <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
    </div>
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Review Center</h1>
        <p className="text-gray-500">Track your mastery and review incorrect answers</p>
      </div>

      {/* Mastery overview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-indigo-600" />
          <h2 className="font-semibold text-gray-900">Unit Mastery</h2>
        </div>

        {mastery.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <BarChart2 className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No attempts yet. Start practicing to track your progress!</p>
            <Link
              href="/practice"
              className="mt-3 inline-block text-indigo-600 text-sm hover:underline"
            >
              Go to Practice →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {mastery.map((m) => {
              const { label, cls } = getMasteryLabel(m.masteryScore)
              return (
                <div key={m.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">
                        Unit {m.unit.number}: {m.unit.name}
                      </span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cls}`}>
                        {label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-gray-400 text-xs">
                        {m.correctAttempts}/{m.totalAttempts} correct
                      </span>
                      <span className="font-bold text-gray-900">{m.masteryScore}%</span>
                    </div>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${getMasteryColor(m.masteryScore)}`}
                      style={{ width: `${m.masteryScore}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Incorrect answers by unit */}
      {incorrectAttempts.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <h2 className="font-semibold text-gray-900">Incorrect Answers ({incorrectAttempts.length})</h2>
          </div>

          <div className="space-y-6">
            {Object.entries(incorrectByUnit).map(([unitName, unitAttempts]) => (
              <div key={unitName}>
                <button
                  onClick={() => setActiveUnit(activeUnit === unitName ? null : unitName)}
                  className="flex items-center justify-between w-full text-left mb-2"
                >
                  <h3 className="font-medium text-gray-800 text-sm">{unitName}</h3>
                  <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                    {unitAttempts.length} incorrect
                  </span>
                </button>

                {(activeUnit === unitName || activeUnit === null) && (
                  <div className="space-y-3">
                    {unitAttempts.slice(0, activeUnit === unitName ? 10 : 2).map((attempt) => (
                      <div key={attempt.id} className="border border-red-100 rounded-lg p-4 bg-red-50">
                        <div className="flex gap-2 mb-2">
                          <span className="text-xs bg-white border border-red-200 text-red-600 px-2 py-0.5 rounded-full font-medium">
                            {attempt.question.type}
                          </span>
                        </div>
                        <p className="text-sm text-gray-900 mb-2">{attempt.question.prompt}</p>
                        <p className="text-xs text-gray-500 mb-1">
                          <span className="font-medium">Your answer:</span> {attempt.response}
                        </p>
                        {attempt.question.correctAnswer && (
                          <p className="text-xs text-green-700">
                            <span className="font-medium">Correct answer:</span> {attempt.question.correctAnswer}
                          </p>
                        )}
                        {attempt.question.explanation && (
                          <p className="text-xs text-blue-700 mt-1 italic">{attempt.question.explanation}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-2 flex gap-2">
                  <Link
                    href={`/practice/mcq?unit=${unitAttempts[0]?.question?.unit?.number}`}
                    className="text-xs text-indigo-600 hover:underline flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" /> Retry this unit
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {incorrectAttempts.length === 0 && mastery.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
          <p className="text-green-700 font-medium">🎉 No incorrect answers yet! Keep practicing to fill your review queue.</p>
        </div>
      )}
    </div>
  )
}
