import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calculateMastery } from '@/lib/planner'

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const attempts = await prisma.attempt.findMany({
      where: { userId },
      include: { question: true },
    })

    const masteryScores = calculateMastery(
      attempts.map((a) => ({
        questionId: a.questionId,
        isCorrect: a.isCorrect,
        question: { unitId: a.question.unitId },
      }))
    )

    for (const { unitId, score } of masteryScores) {
      const unitAttempts = attempts.filter((a) => a.question.unitId === unitId)
      const correctCount = unitAttempts.filter((a) => a.isCorrect).length

      await prisma.masterySnapshot.upsert({
        where: { userId_unitId: { userId, unitId } },
        update: {
          masteryScore: score,
          totalAttempts: unitAttempts.length,
          correctAttempts: correctCount,
          lastUpdated: new Date(),
        },
        create: {
          userId,
          unitId,
          masteryScore: score,
          totalAttempts: unitAttempts.length,
          correctAttempts: correctCount,
        },
      })
    }

    return NextResponse.json({ updated: masteryScores.length })
  } catch (error) {
    console.error('Error updating mastery:', error)
    return NextResponse.json({ error: 'Failed to update mastery' }, { status: 500 })
  }
}
