'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUserId } from '@/lib/hooks'
import { PenTool, BookOpen, FileText, Layers } from 'lucide-react'

interface Unit {
  id: string
  number: number
  name: string
}

const MODES = [
  { key: 'mcq', label: 'Multiple Choice (MCQ)', icon: BookOpen, description: 'Test your knowledge with 4-choice questions' },
  { key: 'saq', label: 'Short Answer (SAQ)', icon: PenTool, description: 'Write concise responses to targeted questions' },
  { key: 'dbq', label: 'Document-Based (DBQ)', icon: FileText, description: 'Analyze primary sources and write an essay' },
  { key: 'leq', label: 'Long Essay (LEQ)', icon: Layers, description: 'Write a full essay with thesis and evidence' },
]

export default function PracticePage() {
  const router = useRouter()
  const { userId, loading } = useUserId()
  const [units, setUnits] = useState<Unit[]>([])
  const [selectedUnit, setSelectedUnit] = useState('all')
  const [selectedMode, setSelectedMode] = useState('mcq')
  const [starting, setStarting] = useState(false)

  useEffect(() => {
    if (loading) return
    if (!userId) { router.replace('/onboarding'); return }
    fetch('/api/units').then(r => r.json()).then(data => {
      if (Array.isArray(data)) setUnits(data)
    })
  }, [userId, loading, router])

  async function handleStart() {
    if (!userId) return
    setStarting(true)
    try {
      if (selectedMode === 'dbq' || selectedMode === 'leq') {
        // Find a question and create a submission
        const qRes = await fetch(
          `/api/questions?type=${selectedMode.toUpperCase()}&unitId=${selectedUnit}&limit=1`,
          { headers: { 'x-user-id': userId } }
        )
        const questions = await qRes.json()
        if (!questions || questions.length === 0) {
          alert('No questions found for this selection.')
          setStarting(false)
          return
        }
        const q = questions[0]
        const subRes = await fetch('/api/submissions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
          body: JSON.stringify({
            questionId: q.id,
            title: `${q.type} Practice - ${q.unit?.name ?? 'AP World History'}`,
          }),
        })
        const submission = await subRes.json()
        router.push(`/workspace/${submission.id}`)
      } else {
        router.push(`/practice/${selectedMode}?unit=${selectedUnit}`)
      }
    } catch (err) {
      console.error(err)
      setStarting(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
    </div>
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Practice Hub</h1>
        <p className="text-gray-500">Choose a unit and question type to start practicing</p>
      </div>

      {/* Unit selector */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">Select Unit</h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          <button
            onClick={() => setSelectedUnit('all')}
            className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
              selectedUnit === 'all'
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'border-gray-200 text-gray-700 hover:border-indigo-300'
            }`}
          >
            All Units
          </button>
          {units.map((unit) => (
            <button
              key={unit.id}
              onClick={() => setSelectedUnit(unit.id)}
              className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                selectedUnit === unit.id
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'border-gray-200 text-gray-700 hover:border-indigo-300'
              }`}
              title={unit.name}
            >
              Unit {unit.number}
            </button>
          ))}
        </div>
        {selectedUnit !== 'all' && (
          <p className="mt-3 text-sm text-gray-500">
            {units.find(u => u.id === selectedUnit)?.name}
          </p>
        )}
      </div>

      {/* Mode selector */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">Select Mode</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {MODES.map(({ key, label, icon: Icon, description }) => (
            <button
              key={key}
              onClick={() => setSelectedMode(key)}
              className={`flex items-start gap-3 p-4 rounded-lg border text-left transition-colors ${
                selectedMode === key
                  ? 'bg-indigo-50 border-indigo-400'
                  : 'border-gray-200 hover:border-indigo-200'
              }`}
            >
              <div className={`p-2 rounded-lg ${selectedMode === key ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <p className="font-medium text-sm text-gray-900">{label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleStart}
        disabled={starting}
        className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
      >
        {starting ? 'Starting...' : 'Start Practice Session'}
      </button>
    </div>
  )
}
