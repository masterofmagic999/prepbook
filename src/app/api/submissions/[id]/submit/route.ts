import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAIEnabled, aiComplete } from '@/lib/ai'

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
      const wordCount = existing.content.trim().split(/\s+/).filter(Boolean).length
      const hasThesis = wordCount > 50
      const hasEvidence = wordCount > 150
      const hasContext = wordCount > 100

      // When GitHub Models is configured, generate AI-enriched per-criterion
      // feedback. Fall back to basic word-count heuristics when AI is absent.
      let aiFeedback: Record<string, string> = {}
      if (isAIEnabled() && wordCount > 10) {
        const prompt = [
          `You are an experienced AP World History grader scoring a ${submission.question.type} essay.`,
          `Rubric criteria: ${rubric.criteria.map((c) => `${c.name} (max ${c.maxPoints} pt${c.maxPoints > 1 ? 's' : ''})`).join(', ')}.`,
          `\nPrompt: ${submission.question.prompt}`,
          `\nEssay (first 2000 chars):\n${existing.content.slice(0, 2000)}`,
          `\nFor each criterion, reply with EXACTLY this format on one line:`,
          `CRITERION_NAME: <brief actionable feedback (1–2 sentences)>`,
          `Only output the criterion lines — no other text.`,
        ].join('\n')

        const reply = await aiComplete(
          [{ role: 'user', content: prompt }],
          600
        )

        if (reply) {
          for (const line of reply.split('\n')) {
            const idx = line.indexOf(':')
            if (idx > 0) {
              const key = line.slice(0, idx).trim()
              const val = line.slice(idx + 1).trim()
              if (key && val) aiFeedback[key] = val
            }
          }
        }
      }

      for (const criterion of rubric.criteria) {
        let score = 0
        if (criterion.name.includes('Thesis') && hasThesis) score = 1
        else if (criterion.name.includes('Evidence') && hasEvidence) score = criterion.maxPoints >= 2 ? 1 : 0
        else if (criterion.name.includes('Contextualization') && hasContext) score = 1

        // Use AI feedback when available; otherwise use generic fallback
        const matchedKey = Object.keys(aiFeedback).find((k) =>
          criterion.name.toLowerCase().includes(k.toLowerCase()) ||
          k.toLowerCase().includes(criterion.name.toLowerCase())
        )
        const feedback =
          matchedKey
            ? aiFeedback[matchedKey]
            : score > 0
            ? `Good work on ${criterion.name.toLowerCase()}.`
            : `Consider strengthening your ${criterion.name.toLowerCase()}.`

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
