'use client'

import { useState } from 'react'
import { CheckCircle, XCircle, AlertCircle, RefreshCw, Wifi } from 'lucide-react'

interface HealthData {
  provider: string
  model: string | null
  hasKey: boolean
  aiEnabled: boolean
  checkedAt: string
  ping: {
    ok: boolean
    latencyMs: number | null
    error: string | null
  } | null
}

type Status = 'idle' | 'loading' | 'ok' | 'error'

const PROVIDER_LABELS: Record<string, string> = {
  github_models: 'GitHub Models',
  openrouter: 'OpenRouter',
  cerebras: 'Cerebras Cloud',
  fallback: 'None (deterministic fallback)',
}

export default function SettingsPage() {
  const [status, setStatus] = useState<Status>('idle')
  const [data, setData] = useState<HealthData | null>(null)
  const [pingStatus, setPingStatus] = useState<Status>('idle')

  async function checkStatus() {
    setStatus('loading')
    setData(null)
    try {
      const res = await fetch('/api/ai/health')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json: HealthData = await res.json()
      setData(json)
      setStatus('ok')
    } catch {
      setStatus('error')
    }
  }

  async function runPing() {
    setPingStatus('loading')
    try {
      const res = await fetch('/api/ai/health?ping=1')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json: HealthData = await res.json()
      setData(json)
      setPingStatus(json.ping?.ok ? 'ok' : 'error')
    } catch {
      setPingStatus('error')
    }
  }

  const providerLabel = data ? (PROVIDER_LABELS[data.provider] ?? data.provider) : null

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings &amp; Diagnostics</h1>
        <p className="text-gray-500 mt-1">Check your AI provider status and app configuration.</p>
      </div>

      {/* AI Status Card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Wifi className="w-5 h-5 text-indigo-500" />
            AI Provider Status
          </h2>
          <button
            onClick={checkStatus}
            disabled={status === 'loading' || pingStatus === 'loading'}
            className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${status === 'loading' ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {status === 'idle' && !data && (
          <div className="text-center py-8">
            <p className="text-gray-400 text-sm mb-4">
              Click &quot;Check Status&quot; to inspect your AI configuration.
            </p>
            <button
              onClick={checkStatus}
              className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
            >
              Check Status
            </button>
          </div>
        )}

        {status === 'loading' && !data && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600" />
          </div>
        )}

        {status === 'error' && !data && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
            <XCircle className="w-5 h-5 text-red-500 shrink-0" />
            <p className="text-red-700 text-sm">
              Could not reach the health endpoint. Make sure the app is running correctly.
            </p>
          </div>
        )}

        {data && (
          <div className="space-y-4">
            {/* Provider row */}
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-500">Provider</span>
              <span className="text-sm font-medium text-gray-900">{providerLabel}</span>
            </div>

            {/* Model row */}
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-500">Model</span>
              <span className="text-sm font-medium text-gray-900">
                {data.model ?? '—'}
              </span>
            </div>

            {/* Key presence */}
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-500">API Key</span>
              <span className={`flex items-center gap-1.5 text-sm font-medium ${data.hasKey ? 'text-green-700' : 'text-red-600'}`}>
                {data.hasKey
                  ? <><CheckCircle className="w-4 h-4" /> Configured</>
                  : <><XCircle className="w-4 h-4" /> Not set</>}
              </span>
            </div>

            {/* AI enabled status */}
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-500">AI Mode</span>
              {data.aiEnabled
                ? <span className="flex items-center gap-1.5 text-sm font-medium text-green-700"><CheckCircle className="w-4 h-4" /> Enabled</span>
                : <span className="flex items-center gap-1.5 text-sm font-medium text-amber-600"><AlertCircle className="w-4 h-4" /> Disabled — deterministic fallback active</span>
              }
            </div>

            {/* Last checked */}
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-500">Status checked at</span>
              <span className="text-sm text-gray-700">
                {new Date(data.checkedAt).toLocaleTimeString()}
              </span>
            </div>

            {/* Ping result */}
            {data.ping !== null && (
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">Live ping</span>
                {data.ping.ok
                  ? <span className="flex items-center gap-1.5 text-sm font-medium text-green-700">
                      <CheckCircle className="w-4 h-4" />
                      Passed {data.ping.latencyMs !== null ? `(${data.ping.latencyMs} ms)` : ''}
                    </span>
                  : <span className="flex items-center gap-1.5 text-sm font-medium text-red-600">
                      <XCircle className="w-4 h-4" />
                      Failed
                    </span>
                }
              </div>
            )}

            {/* Error detail */}
            {data.ping?.error && (
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-700 mb-1">Ping failed</p>
                  <p className="text-sm text-red-600">{data.ping.error}</p>
                  <p className="text-xs text-red-500 mt-2">
                    Check your <code className="bg-red-100 px-1 rounded">.env.local</code> file and restart the dev server.
                  </p>
                </div>
              </div>
            )}

            {/* Run ping button */}
            {data.aiEnabled && data.ping === null && (
              <button
                onClick={runPing}
                disabled={pingStatus === 'loading'}
                className="w-full mt-2 flex items-center justify-center gap-2 bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${pingStatus === 'loading' ? 'animate-spin' : ''}`} />
                {pingStatus === 'loading' ? 'Testing connection…' : 'Run Live AI Connectivity Test'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Fallback mode info */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-amber-800 mb-2">About fallback mode</h3>
        <p className="text-sm text-amber-700">
          When AI is unavailable or disabled, PrepBook uses deterministic rule-based logic for all features.
          Practice sessions, the study planner, and writing feedback all continue to work — just without
          AI-generated explanations and personalized coaching text.
        </p>
        <p className="text-sm text-amber-700 mt-2">
          To enable AI, add your provider key to{' '}
          <code className="bg-amber-100 px-1 rounded">.env.local</code> and restart{' '}
          <code className="bg-amber-100 px-1 rounded">npm run dev</code>.
        </p>
      </div>
    </div>
  )
}
