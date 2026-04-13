import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const unitId = searchParams.get('unitId')
    const type = searchParams.get('type')
    const limit = parseInt(searchParams.get('limit') ?? '10')

    const questions = await prisma.question.findMany({
      where: {
        ...(unitId && unitId !== 'all' ? { unitId } : {}),
        ...(type ? { type } : {}),
      },
      take: limit,
      orderBy: { createdAt: 'asc' },
      include: { unit: true },
    })

    return NextResponse.json(questions)
  } catch (error) {
    console.error('Error fetching questions:', error)
    return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 })
  }
}
