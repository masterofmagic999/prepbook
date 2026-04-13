import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { questionId, title, content = '', timerSeconds } = body

    if (!questionId || !title) {
      return NextResponse.json({ error: 'questionId and title are required' }, { status: 400 })
    }

    const submission = await prisma.writingSubmission.create({
      data: {
        userId,
        questionId,
        title,
        content,
        wordCount: content.trim().split(/\s+/).filter(Boolean).length,
        status: 'DRAFT',
        timerSeconds: timerSeconds ?? null,
      },
      include: {
        question: { include: { unit: true } },
      },
    })

    return NextResponse.json(submission)
  } catch (error) {
    console.error('Error creating submission:', error)
    return NextResponse.json({ error: 'Failed to create submission' }, { status: 500 })
  }
}
