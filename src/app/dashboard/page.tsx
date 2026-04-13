'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useUserId } from '@/lib/hooks'
import { BookOpen, Target, Calendar, PenTool, BarChart2, TrendingUp, Plus } from 'lucide-react'

interface MasteryItem {
  id: string
  unitId: string
  masteryScore: number
  totalAttempts: number
  unit: { number: number; name: string }
}

interface StudyTask {
  id: string
  title: string
  type: string
  durationMinutes: number
  isCompleted: boolean
  unitId: string | null
  unit?: { name: string } | null
  date: string
}

interface Unit {
  id: string
  number: number
  name: string
}

export default function DashboardPage() {
  const router = useRouter()
  const { userId, loading } = useUserId()
  const [mastery, setMastery] = useState<MasteryItem[]>([])
  const [todayTasks, setTodayTasks] = useState<StudyTask[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [hasPlan, setHasPlan] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)

  useEffect(() => {
    if (loading) return
    if (!userId) {
      router.replace('/onboarding')
      return
    }

    async function fetchData() {
      if (!userId) return
      setDataLoading(true)
      try {
        const [masteryRes, planRes, unitsRes] = await Promise.all([
          fetch('/api/mastery', { headers: { 'x-user-id': userId } }),
          fetch('/api/planner', { headers: { 'x-user-id': userId } }),
          fetch('/api/units'),
        ])

        const masteryData = await masteryRes.json()
        const planData = await planRes.json()
        const unitsData = await unitsRes.json()

        setMastery(Array.isArray(masteryData) ? masteryData : [])
        setUnits(Array.isArray(unitsData) ? unitsData : [])

        if (planData && planData.tasks) {
          setHasPlan(true)
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          const tomorrow = new Date(today)
          tomorrow.setDate(tomorrow.getDate() + 1)

          const todayItems = planData.tasks.filter((t: StudyTask) => {
            const taskDate = new Date(t.date)
            taskDate.setHours(0, 0, 0, 0)
            return taskDate.getTime() === today.getTime()
          })
          setTodayTasks(todayItems)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setDataLoading(false)
      }
    }

    fetchData()
  }, [userId, loading, router])

  const getMasteryColor = (score: number) => {
    if (score >= 80) return 'bg-green-500'
    if (score >= 60) return 'bg-yellow-500'
    if (score >= 40) return 'bg-orange-500'
    return 'bg-red-500'
  }

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      MCQ: 'bg-blue-100 text-blue-700',
      SAQ: 'bg-purple-100 text-purple-700',
      DBQ: 'bg-orange-100 text-orange-700',
      LEQ: 'bg-green-100 text-green-700',
      REVIEW: 'bg-gray-100 text-gray-700',
      MIXED: 'bg-indigo-100 text-indigo-700',
    }
    return colors[type] ?? 'bg-gray-100 text-gray-700'
  }

  if (loading || dataLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">AP World History Practice Hub</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-4 h-4 text-indigo-500" />
            <span className="text-xs text-gray-500 font-medium">Units</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{units.length}</p>
          <p className="text-xs text-gray-400">Total units</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="text-xs text-gray-500 font-medium">Mastery</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {mastery.length > 0
              ? Math.round(mastery.reduce((s, m) => s + m.masteryScore, 0) / mastery.length)
              : 0}%
          </p>
          <p className="text-xs text-gray-400">Average score</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-blue-500" />
            <span className="text-xs text-gray-500 font-medium">Today</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{todayTasks.length}</p>
          <p className="text-xs text-gray-400">Tasks scheduled</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-purple-500" />
            <span className="text-xs text-gray-500 font-medium">Attempts</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {mastery.reduce((s, m) => s + m.totalAttempts, 0)}
          </p>
          <p className="text-xs text-gray-400">Total questions</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Today's tasks */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Today&apos;s Tasks</h2>
            <Link href="/planner" className="text-sm text-indigo-600 hover:underline">
              View all
            </Link>
          </div>

          {!hasPlan ? (
            <div className="text-center py-8">
              <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm mb-4">No study plan yet</p>
              <Link
                href="/planner"
                className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700"
              >
                <Plus className="w-4 h-4" /> Generate Plan
              </Link>
            </div>
          ) : todayTasks.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 text-sm">No tasks scheduled for today</p>
              <Link href="/planner" className="text-indigo-600 text-sm hover:underline mt-1 block">
                View upcoming tasks
              </Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {todayTasks.map((task) => (
                <li
                  key={task.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border ${
                    task.isCompleted ? 'bg-gray-50 border-gray-200 opacity-60' : 'border-gray-200'
                  }`}
                >
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full ${getTypeColor(task.type)}`}
                  >
                    {task.type}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${task.isCompleted ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                      {task.title}
                    </p>
                    <p className="text-xs text-gray-400">{task.durationMinutes} min</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Unit mastery */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Unit Mastery</h2>
            <Link href="/review" className="text-sm text-indigo-600 hover:underline">
              Review all
            </Link>
          </div>

          {units.length === 0 ? (
            <p className="text-gray-400 text-sm">Loading units...</p>
          ) : (
            <ul className="space-y-3">
              {units.slice(0, 6).map((unit) => {
                const m = mastery.find((x) => x.unitId === unit.id)
                const score = m?.masteryScore ?? 0
                return (
                  <li key={unit.id}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700 truncate">
                        <span className="font-medium">Unit {unit.number}:</span> {unit.name}
                      </span>
                      <span className="text-gray-500 ml-2 shrink-0">{score}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${getMasteryColor(score)}`}
                        style={{ width: `${score}%` }}
                      />
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Quick links */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { href: '/practice', label: 'MCQ Practice', icon: PenTool, color: 'text-blue-600 bg-blue-50' },
          { href: '/practice', label: 'Writing Practice', icon: BookOpen, color: 'text-green-600 bg-green-50' },
          { href: '/planner', label: 'Study Planner', icon: Calendar, color: 'text-purple-600 bg-purple-50' },
          { href: '/review', label: 'Review Center', icon: BarChart2, color: 'text-orange-600 bg-orange-50' },
        ].map(({ href, label, icon: Icon, color }) => (
          <Link
            key={label}
            href={href}
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:border-indigo-200 hover:shadow-md transition-all"
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <p className="text-sm font-medium text-gray-900">{label}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
