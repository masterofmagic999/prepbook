import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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
    const { isCompleted, rescheduleDate } = body

    const task = await prisma.studyTask.findUnique({
      where: { id },
      include: { plan: true },
    })

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }
    if (task.plan.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const updated = await prisma.studyTask.update({
      where: { id },
      data: {
        isCompleted: isCompleted !== undefined ? Boolean(isCompleted) : task.isCompleted,
        completedAt: isCompleted ? new Date() : null,
        ...(rescheduleDate
          ? {
              date: new Date(rescheduleDate),
              isRescheduled: true,
              rescheduledFrom: task.date,
            }
          : {}),
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating task:', error)
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 })
  }
}
