import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateStudyPlan } from '@/lib/planner'

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const plan = await prisma.studyPlan.findFirst({
      where: { userId, isActive: true },
      orderBy: { createdAt: 'desc' },
      include: {
        tasks: {
          orderBy: { date: 'asc' },
          include: { unit: true },
        },
      },
    })

    return NextResponse.json(plan)
  } catch (error) {
    console.error('Error fetching plan:', error)
    return NextResponse.json({ error: 'Failed to fetch plan' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { examDate, targetScore, hoursPerWeek } = body

    if (!examDate || !targetScore || !hoursPerWeek) {
      return NextResponse.json(
        { error: 'examDate, targetScore, and hoursPerWeek are required' },
        { status: 400 }
      )
    }

    // Deactivate existing plans
    await prisma.studyPlan.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false },
    })

    // Get units and mastery
    const [units, masterySnapshots] = await Promise.all([
      prisma.unit.findMany({ orderBy: { number: 'asc' } }),
      prisma.masterySnapshot.findMany({ where: { userId } }),
    ])

    // Create the plan
    const plan = await prisma.studyPlan.create({
      data: {
        userId,
        examDate: new Date(examDate),
        targetScore: parseInt(targetScore),
        hoursPerWeek: parseFloat(hoursPerWeek),
        isActive: true,
      },
    })

    // Generate tasks
    const taskData = generateStudyPlan({
      userId,
      planId: plan.id,
      examDate: new Date(examDate),
      targetScore: parseInt(targetScore),
      hoursPerWeek: parseFloat(hoursPerWeek),
      masteryScores: masterySnapshots.map((m) => ({
        unitId: m.unitId,
        unitNumber: units.find((u) => u.id === m.unitId)?.number ?? 0,
        masteryScore: m.masteryScore,
      })),
      units: units.map((u) => ({ id: u.id, number: u.number, name: u.name })),
    })

    // Bulk create tasks
    await prisma.studyTask.createMany({ data: taskData })

    const fullPlan = await prisma.studyPlan.findUnique({
      where: { id: plan.id },
      include: {
        tasks: {
          orderBy: { date: 'asc' },
          include: { unit: true },
        },
      },
    })

    return NextResponse.json(fullPlan)
  } catch (error) {
    console.error('Error generating plan:', error)
    return NextResponse.json({ error: 'Failed to generate plan' }, { status: 500 })
  }
}
