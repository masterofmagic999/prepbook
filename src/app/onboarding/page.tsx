'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUserId } from '@/lib/hooks'
import { BookOpen, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react'

interface FormData {
  name: string
  email: string
  examDate: string
  targetScore: number
  hoursPerWeek: number
}

export default function OnboardingPage() {
  const router = useRouter()
  const { saveUserId } = useUserId()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState<FormData>({
    name: '',
    email: '',
    examDate: '',
    targetScore: 4,
    hoursPerWeek: 5,
  })

  const update = (field: keyof FormData, value: string | number) =>
    setForm((f) => ({ ...f, [field]: value }))

  async function handleSubmit() {
    setLoading(true)
    setError('')
    try {
      const userRes = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email }),
      })
      if (!userRes.ok) throw new Error('Failed to create account')
      const user = await userRes.json()
      saveUserId(user.id)

      await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-user-id': user.id },
        body: JSON.stringify({
          examDate: form.examDate,
          targetScore: form.targetScore,
          hoursPerWeek: form.hoursPerWeek,
        }),
      })

      setStep(4)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const MIN_DAYS_UNTIL_EXAM = 7
  const minDate = new Date()
  minDate.setDate(minDate.getDate() + MIN_DAYS_UNTIL_EXAM)
  const minDateStr = minDate.toISOString().split('T')[0]

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        {/* Header */}
        <div className="flex items-center gap-2 mb-8">
          <BookOpen className="w-7 h-7 text-indigo-600" />
          <h1 className="text-2xl font-bold text-gray-900">PrepBook</h1>
        </div>

        {/* Progress */}
        {step < 4 && (
          <div className="mb-8">
            <div className="flex gap-2 mb-2">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`h-2 flex-1 rounded-full ${
                    s <= step ? 'bg-indigo-600' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
            <p className="text-sm text-gray-500">Step {step} of 3</p>
          </div>
        )}

        {/* Step 1: Name + Email */}
        {step === 1 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-1">Create your account</h2>
            <p className="text-gray-500 mb-6">Let&apos;s get you set up for success on the AP exam.</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => update('name', e.target.value)}
                  placeholder="Alex Johnson"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                  placeholder="alex@example.com"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!form.name || !form.email}
              className="mt-6 w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step 2: Exam date + target score */}
        {step === 2 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-1">Exam details</h2>
            <p className="text-gray-500 mb-6">Tell us about your upcoming AP exam.</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">AP Exam Date</label>
                <input
                  type="date"
                  min={minDateStr}
                  value={form.examDate}
                  onChange={(e) => update('examDate', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Score: <span className="text-indigo-600 font-bold">{form.targetScore}</span>/5
                </label>
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={form.targetScore}
                  onChange={(e) => update('targetScore', parseInt(e.target.value))}
                  className="w-full accent-indigo-600"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>1 (Lowest)</span>
                  <span>3 (Passing)</span>
                  <span>5 (Perfect)</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setStep(1)}
                className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-50 flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!form.examDate}
                className="flex-1 bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Study hours */}
        {step === 3 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-1">Study schedule</h2>
            <p className="text-gray-500 mb-6">How many hours per week can you dedicate to studying?</p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hours per week: <span className="text-indigo-600 font-bold">{form.hoursPerWeek}h</span>
              </label>
              <input
                type="range"
                min={1}
                max={20}
                step={0.5}
                value={form.hoursPerWeek}
                onChange={(e) => update('hoursPerWeek', parseFloat(e.target.value))}
                className="w-full accent-indigo-600"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>1h</span>
                <span>10h</span>
                <span>20h</span>
              </div>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setStep(2)}
                className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-50 flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                ) : (
                  <>Get Started <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Success */}
        {step === 4 && (
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="w-16 h-16 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">You&apos;re all set!</h2>
            <p className="text-gray-500 mb-8">
              Your PrepBook account is ready. Time to start your AP World History journey.
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 flex items-center justify-center gap-2"
            >
              Go to Dashboard <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
