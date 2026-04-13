import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const status = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: 'unknown' as 'ok' | 'error' | 'unknown',
    databaseError: undefined as string | undefined,
  }

  try {
    await prisma.$connect()
    status.database = 'ok'
  } catch (err) {
    status.database = 'error'
    status.databaseError = err instanceof Error ? err.message : String(err)
    return NextResponse.json(status, { status: 503 })
  }

  return NextResponse.json(status)
}
