import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const mastery = await prisma.masterySnapshot.findMany({
      where: { userId },
      include: { unit: true },
      orderBy: { unit: { number: 'asc' } },
    })

    return NextResponse.json(mastery)
  } catch (error) {
    console.error('Error fetching mastery:', error)
    return NextResponse.json({ error: 'Failed to fetch mastery' }, { status: 500 })
  }
}
