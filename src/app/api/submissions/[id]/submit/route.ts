import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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
      where: { questionType: existing.status === 'FINAL' ? 'LEQ' : submission.question.type },
      include: { criteria: { orderBy: { orderIndex: 'asc' } } },
    })

    if (rubric && submission.scores.length === 0) {
      const wordCount = existing.content.trim().split(/\s+/).filter(Boolean).length
      const hasThesis = wordCount > 50
      const hasEvidence = wordCount > 150
      const hasContext = wordCount > 100

      for (const criterion of rubric.criteria) {
        let score = 0
        if (criterion.name.includes('Thesis') && hasThesis) score = 1
        else if (criterion.name.includes('Evidence') && hasEvidence) score = criterion.maxPoints >= 2 ? 1 : 0
        else if (criterion.name.includes('Contextualization') && hasContext) score = 1

        await prisma.submissionScore.create({
          data: {
            submissionId: id,
            rubricCriterionId: criterion.id,
            criterionName: criterion.name,
            score,
            maxScore: criterion.maxPoints,
            feedback: score > 0
              ? `Good work on ${criterion.name.toLowerCase()}.`
              : `Consider strengthening your ${criterion.name.toLowerCase()}.`,
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
