import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const submission = await prisma.writingSubmission.findUnique({
      where: { id },
      include: {
        question: { include: { unit: true } },
        scores: true,
      },
    })

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    if (submission.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json(submission)
  } catch (error) {
    console.error('Error fetching submission:', error)
    return NextResponse.json({ error: 'Failed to fetch submission' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { content, wordCount, timerSeconds } = body

    const existing = await prisma.writingSubmission.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }
    if (existing.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const updated = await prisma.writingSubmission.update({
      where: { id },
      data: {
        content: content !== undefined ? content : existing.content,
        wordCount:
          wordCount !== undefined
            ? wordCount
            : content !== undefined
            ? content.trim().split(/\s+/).filter(Boolean).length
            : existing.wordCount,
        timerSeconds: timerSeconds !== undefined ? timerSeconds : existing.timerSeconds,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating submission:', error)
    return NextResponse.json({ error: 'Failed to update submission' }, { status: 500 })
  }
}
