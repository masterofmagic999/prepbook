'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUserId } from '@/lib/hooks'
import { Calendar, CheckCircle, Clock, RefreshCw, Plus } from 'lucide-react'

interface StudyTask {
  id: string
  date: string
  title: string
  description: string
  type: string
  durationMinutes: number
  isCompleted: boolean
  isRescheduled: boolean
  unit?: { number: number; name: string } | null
}

interface StudyPlan {
  id: string
  examDate: string
  targetScore: number
  hoursPerWeek: number
  tasks: StudyTask[]
}

interface Profile {
  examDate: string
  targetScore: number
  hoursPerWeek: number
}

const TYPE_COLORS: Record<string, string> = {
  MCQ: 'bg-blue-100 text-blue-700',
  SAQ: 'bg-purple-100 text-purple-700',
  DBQ: 'bg-orange-100 text-orange-700',
  LEQ: 'bg-green-100 text-green-700',
  REVIEW: 'bg-gray-100 text-gray-700',
  MIXED: 'bg-indigo-100 text-indigo-700',
}

// Return a YYYY-MM-DD key derived from the UTC calendar date.
// Planner stores dates as UTC noon; reading getUTC* avoids local-timezone
// midnight boundaries that would render tasks as "yesterday".
function utcDateKey(date: Date): string {
  const y = date.getUTCFullYear()
  const m = String(date.getUTCMonth() + 1).padStart(2, '0')
  const d = String(date.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function groupByDate(tasks: StudyTask[]): Record<string, StudyTask[]> {
  const grouped: Record<string, StudyTask[]> = {}
  for (const task of tasks) {
    const key = utcDateKey(new Date(task.date))
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(task)
  }
  return grouped
}

export default function PlannerPage() {
  const router = useRouter()
  const { userId, loading } = useUserId()
  const [plan, setPlan] = useState<StudyPlan | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [dataLoading, setDataLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  const fetchData = useCallback(async () => {
    if (!userId) return
    setDataLoading(true)
    try {
      const [planRes, profileRes] = await Promise.all([
        fetch('/api/planner', { headers: { 'x-user-id': userId } }),
        fetch('/api/profile', { headers: { 'x-user-id': userId } }),
      ])
      const planData = await planRes.json()
      const profileData = await profileRes.json()
      setPlan(planData)
      setProfile(profileData)
    } finally {
      setDataLoading(false)
    }
  }, [userId])

  useEffect(() => {
    if (loading) return
    if (!userId) { router.replace('/onboarding'); return }
    fetchData()
  }, [userId, loading, router, fetchData])

  async function handleGenerate() {
    if (!userId || !profile) return
    setGenerating(true)
    try {
      const res = await fetch('/api/planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
        body: JSON.stringify({
          examDate: profile.examDate,
          targetScore: profile.targetScore,
          hoursPerWeek: profile.hoursPerWeek,
        }),
      })
      const data = await res.json()
      setPlan(data)
    } finally {
      setGenerating(false)
    }
  }

  async function markComplete(taskId: string, isCompleted: boolean) {
    if (!userId) return
    await fetch(`/api/planner/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
      body: JSON.stringify({ isCompleted }),
    })
    setPlan(p => p ? {
      ...p,
      tasks: p.tasks.map(t => t.id === taskId ? { ...t, isCompleted } : t),
    } : null)
  }

  if (loading || dataLoading) {
    return <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
    </div>
  }

  const todayKey = utcDateKey(new Date())

  // Show tasks from yesterday (-1) through next 14 days
  const upcoming = plan?.tasks?.filter(t => {
    const d = new Date(t.date)
    const taskMs = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
    const now = new Date()
    const todayMs = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    const diff = (taskMs - todayMs) / (1000 * 60 * 60 * 24)
    return diff >= -1 && diff <= 14
  }) ?? []

  const grouped = groupByDate(upcoming)
  const sortedDates = Object.keys(grouped).sort()

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Study Planner</h1>
          <p className="text-gray-500">Your personalized AP World History schedule</p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating || !profile}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
        >
          {plan ? <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} /> : <Plus className="w-4 h-4" />}
          {generating ? 'Generating...' : plan ? 'Regenerate Plan' : 'Generate Plan'}
        </button>
      </div>

      {!profile && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
          <p className="text-yellow-800 text-sm">
            Complete your profile (exam date & study hours) before generating a plan.
          </p>
        </div>
      )}

      {plan && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-6 flex gap-6 text-sm">
          <div>
            <span className="text-indigo-500 font-medium">Exam Date: </span>
            <span className="text-indigo-900">{new Date(plan.examDate).toLocaleDateString()}</span>
          </div>
          <div>
            <span className="text-indigo-500 font-medium">Target Score: </span>
            <span className="text-indigo-900">{plan.targetScore}/5</span>
          </div>
          <div>
            <span className="text-indigo-500 font-medium">Hours/week: </span>
            <span className="text-indigo-900">{plan.hoursPerWeek}h</span>
          </div>
          <div>
            <span className="text-indigo-500 font-medium">Total Tasks: </span>
            <span className="text-indigo-900">{plan.tasks?.length ?? 0}</span>
          </div>
        </div>
      )}

      {!plan ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Study Plan Yet</h3>
          <p className="text-gray-400 text-sm mb-6">Generate a personalized study plan based on your exam date and goals.</p>
          <button
            onClick={handleGenerate}
            disabled={generating || !profile}
            className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {generating ? 'Generating...' : 'Generate My Plan'}
          </button>
        </div>
      ) : upcoming.length === 0 ? (
        <p className="text-gray-400 text-center py-12">No upcoming tasks in the next 14 days.</p>
      ) : (
        <div className="space-y-6">
          {sortedDates.map((dateStr) => {
            const tasks = grouped[dateStr]
            // Parse as UTC noon so toLocaleDateString shows the correct calendar day
            const [y, mo, d] = dateStr.split('-').map(Number)
            const date = new Date(Date.UTC(y, mo - 1, d, 12, 0, 0, 0))
            const isToday = dateStr === todayKey

            return (
              <div key={dateStr}>
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-2 h-2 rounded-full ${isToday ? 'bg-indigo-600' : 'bg-gray-300'}`} />
                  <h3 className={`font-semibold text-sm ${isToday ? 'text-indigo-700' : 'text-gray-600'}`}>
                    {isToday ? 'Today — ' : ''}{date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                  </h3>
                </div>

                <div className="space-y-2 ml-4">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className={`bg-white rounded-xl border p-4 flex items-start gap-3 transition-colors ${
                        task.isCompleted ? 'border-gray-100 opacity-60' : 'border-gray-200 hover:border-indigo-200'
                      }`}
                    >
                      <button
                        onClick={() => markComplete(task.id, !task.isCompleted)}
                        className={`mt-0.5 shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                          task.isCompleted
                            ? 'bg-green-500 border-green-500'
                            : 'border-gray-300 hover:border-indigo-500'
                        }`}
                      >
                        {task.isCompleted && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${TYPE_COLORS[task.type] ?? 'bg-gray-100 text-gray-600'}`}>
                            {task.type}
                          </span>
                          {task.unit && (
                            <span className="text-xs text-gray-400">Unit {task.unit.number}</span>
                          )}
                        </div>
                        <p className={`text-sm font-medium ${task.isCompleted ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                          {task.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">{task.description}</p>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-400 shrink-0">
                        <Clock className="w-3 h-3" />
                        {task.durationMinutes}m
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
