'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUserId } from '@/lib/hooks'

export default function HomePage() {
  const router = useRouter()
  const { userId, loading } = useUserId()

  useEffect(() => {
    if (loading) return
    if (userId) {
      router.replace('/dashboard')
    } else {
      router.replace('/onboarding')
    }
  }, [userId, loading, router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
    </div>
  )
}
