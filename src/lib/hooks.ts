'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

const USER_ID_KEY = 'prepbook_user_id'

export function useUserId() {
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const stored = localStorage.getItem(USER_ID_KEY)
    setUserId(stored)
    setLoading(false)
  }, [])

  const saveUserId = useCallback((id: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(USER_ID_KEY, id)
    }
    setUserId(id)
  }, [])

  const clearUserId = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(USER_ID_KEY)
    }
    setUserId(null)
  }, [])

  return { userId, loading, saveUserId, clearUserId }
}

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}

export function useAutoSave(
  content: string,
  submissionId: string | null,
  userId: string | null,
  interval = 5000
) {
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error' | 'unsaved'>('saved')
  const lastSavedRef = useRef(content)

  useEffect(() => {
    if (!submissionId || !userId || content === lastSavedRef.current) return

    setSaveStatus('unsaved')
    const timer = setTimeout(async () => {
      setSaveStatus('saving')
      try {
        const res = await fetch(`/api/submissions/${submissionId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': userId,
          },
          body: JSON.stringify({
            content,
            wordCount: content.trim().split(/\s+/).filter(Boolean).length,
          }),
        })
        if (res.ok) {
          lastSavedRef.current = content
          setSaveStatus('saved')
        } else {
          setSaveStatus('error')
        }
      } catch {
        setSaveStatus('error')
      }
    }, interval)

    return () => clearTimeout(timer)
  }, [content, submissionId, userId, interval])

  return saveStatus
}
