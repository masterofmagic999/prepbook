import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { questionId, response, isCorrect, score, feedback, timeSpentSeconds } = body

    if (!questionId || response === undefined) {
      return NextResponse.json({ error: 'questionId and response are required' }, { status: 400 })
    }

    const attempt = await prisma.attempt.create({
      data: {
        userId,
        questionId,
        response: String(response),
        isCorrect: isCorrect !== undefined ? Boolean(isCorrect) : null,
        score: score !== undefined ? Number(score) : null,
        feedback: feedback ?? null,
        timeSpentSeconds: timeSpentSeconds ?? null,
      },
    })

    // Update mastery snapshot
    const question = await prisma.question.findUnique({ where: { id: questionId } })
    if (question) {
      const existing = await prisma.masterySnapshot.findUnique({
        where: { userId_unitId: { userId, unitId: question.unitId } },
      })
      const totalAttempts = (existing?.totalAttempts ?? 0) + 1
      const correctAttempts = (existing?.correctAttempts ?? 0) + (isCorrect ? 1 : 0)
      const masteryScore = Math.round((correctAttempts / totalAttempts) * 100)

      await prisma.masterySnapshot.upsert({
        where: { userId_unitId: { userId, unitId: question.unitId } },
        update: { totalAttempts, correctAttempts, masteryScore, lastUpdated: new Date() },
        create: { userId, unitId: question.unitId, totalAttempts, correctAttempts, masteryScore },
      })
    }

    return NextResponse.json(attempt)
  } catch (error) {
    console.error('Error recording attempt:', error)
    return NextResponse.json({ error: 'Failed to record attempt' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') ?? '50')

    const attempts = await prisma.attempt.findMany({
      where: { userId },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        question: {
          include: { unit: true },
        },
      },
    })

    return NextResponse.json(attempts)
  } catch (error) {
    console.error('Error fetching attempts:', error)
    return NextResponse.json({ error: 'Failed to fetch attempts' }, { status: 500 })
  }
}
