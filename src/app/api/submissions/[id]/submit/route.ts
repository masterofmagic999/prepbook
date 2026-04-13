import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAIProvider } from '@/lib/ai'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const existing = await prisma.writingSubmission.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }
    if (existing.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const submission = await prisma.writingSubmission.update({
      where: { id },
      data: { status: 'FINAL' },
      include: {
        question: { include: { unit: true } },
        scores: true,
      },
    })

    // Basic auto-scoring: create placeholder scores based on rubric
    const rubric = await prisma.rubric.findFirst({
      where: { questionType: submission.question.type },
      include: { criteria: { orderBy: { orderIndex: 'asc' } } },
    })

    if (rubric && submission.scores.length === 0) {
      const ai = getAIProvider()

      for (const criterion of rubric.criteria) {
        const { score, feedback } = await ai.generateWritingFeedback({
          questionType: submission.question.type,
          prompt: submission.question.prompt,
          draft: existing.content,
          criterionName: criterion.name,
          maxPoints: criterion.maxPoints,
        })

        await prisma.submissionScore.create({
          data: {
            submissionId: id,
            rubricCriterionId: criterion.id,
            criterionName: criterion.name,
            score,
            maxScore: criterion.maxPoints,
            feedback,
          },
        })
      }
    }

    const finalSubmission = await prisma.writingSubmission.findUnique({
      where: { id },
      include: { question: { include: { unit: true } }, scores: true },
    })

    return NextResponse.json(finalSubmission)
  } catch (error) {
    console.error('Error submitting submission:', error)
    return NextResponse.json({ error: 'Failed to submit' }, { status: 500 })
  }
}
