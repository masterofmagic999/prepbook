export interface PlannerParams {
  userId: string
  planId: string
  examDate: Date
  targetScore: number
  hoursPerWeek: number
  masteryScores: Array<{ unitId: string; unitNumber: number; masteryScore: number }>
  units: Array<{ id: string; number: number; name: string }>
}

export interface MasteryScore {
  unitId: string
  score: number
}

export interface StudyTaskData {
  planId: string
  date: Date
  title: string
  description: string
  type: string
  unitId: string | null
  durationMinutes: number
  isCompleted: boolean
  isRescheduled: boolean
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function getWeekday(date: Date): number {
  return date.getDay() // 0=Sun, 6=Sat
}

function isWeekend(date: Date): boolean {
  const day = getWeekday(date)
  return day === 0 || day === 6
}

export function generateStudyPlan(params: PlannerParams): StudyTaskData[] {
  const { planId, examDate, targetScore, hoursPerWeek, masteryScores, units } = params
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const exam = new Date(examDate)
  exam.setHours(0, 0, 0, 0)

  const totalDays = Math.max(
    Math.floor((exam.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)),
    7
  )

  const minutesPerDay = Math.round((hoursPerWeek * 60) / 5) // assume 5 study days/week
  const tasks: StudyTaskData[] = []

  // Sort units by mastery ascending (weakest first)
  const sortedUnits = [...units].sort((a, b) => {
    const aMastery = masteryScores.find((m) => m.unitId === a.id)?.masteryScore ?? 0
    const bMastery = masteryScores.find((m) => m.unitId === b.id)?.masteryScore ?? 0
    return aMastery - bMastery
  })

  const totalWeeks = Math.ceil(totalDays / 7)
  const isFinalPhase = (weekIndex: number) => weekIndex >= totalWeeks - 3

  let unitIndex = 0
  let dayOffset = 0

  while (dayOffset < totalDays) {
    const currentDate = addDays(today, dayOffset)

    // Skip weekends for scheduled tasks
    if (isWeekend(currentDate)) {
      dayOffset++
      continue
    }

    const weekIndex = Math.floor(dayOffset / 7)
    const unit = sortedUnits[unitIndex % sortedUnits.length]

    if (isFinalPhase(weekIndex)) {
      // Final 3 weeks: heavier MCQ/MIXED review
      const typeRoll = Math.random()
      let type: string
      if (typeRoll < 0.4) type = 'MCQ'
      else if (typeRoll < 0.7) type = 'MIXED'
      else if (typeRoll < 0.85) type = 'SAQ'
      else type = 'REVIEW'

      tasks.push({
        planId,
        date: currentDate,
        title: `${type} Review - ${unit.name}`,
        description: getTaskDescription(type, unit.name, true),
        type,
        unitId: unit.id,
        durationMinutes: Math.min(minutesPerDay, 60),
        isCompleted: false,
        isRescheduled: false,
      })
    } else {
      // Regular phase: distribute task types
      const taskInWeek = dayOffset % 5
      let type: string
      if (taskInWeek === 0 || taskInWeek === 1) type = 'MCQ'
      else if (taskInWeek === 2) type = 'SAQ'
      else if (taskInWeek === 3) type = 'DBQ'
      else type = 'LEQ'

      tasks.push({
        planId,
        date: currentDate,
        title: `${type} Practice - ${unit.name}`,
        description: getTaskDescription(type, unit.name, false),
        type,
        unitId: unit.id,
        durationMinutes: Math.min(minutesPerDay, getDefaultDuration(type)),
        isCompleted: false,
        isRescheduled: false,
      })
    }

    unitIndex++
    dayOffset++
  }

  // Add a final exam day task if we have time
  if (totalDays > 3) {
    const finalReviewDate = addDays(exam, -1)
    if (finalReviewDate > today) {
      tasks.push({
        planId,
        date: finalReviewDate,
        title: 'Final Exam Review',
        description: 'Review all units, key terms, and practice timed questions. Focus on your weakest units.',
        type: 'MIXED',
        unitId: null,
        durationMinutes: 120,
        isCompleted: false,
        isRescheduled: false,
      })
    }
  }

  return tasks
}

function getDefaultDuration(type: string): number {
  switch (type) {
    case 'MCQ': return 30
    case 'SAQ': return 30
    case 'DBQ': return 60
    case 'LEQ': return 45
    case 'REVIEW': return 45
    case 'MIXED': return 60
    default: return 30
  }
}

function getTaskDescription(type: string, unitName: string, isFinalPhase: boolean): string {
  const prefix = isFinalPhase ? 'Final review: ' : ''
  switch (type) {
    case 'MCQ':
      return `${prefix}Practice multiple choice questions on ${unitName}. Focus on key concepts, dates, and cause-and-effect relationships.`
    case 'SAQ':
      return `${prefix}Practice short answer questions on ${unitName}. Aim to write concise, specific responses with evidence.`
    case 'DBQ':
      return `${prefix}Work on a document-based question related to ${unitName}. Practice sourcing, contextualization, and evidence use.`
    case 'LEQ':
      return `${prefix}Practice a long essay question for ${unitName}. Focus on your thesis, contextualization, and supporting evidence.`
    case 'REVIEW':
      return `Review key terms, events, and patterns in ${unitName}. Use flashcards or your notes to reinforce memory.`
    case 'MIXED':
      return `${prefix}Mixed practice session covering ${unitName}. Include both MCQ and writing to simulate exam conditions.`
    default:
      return `Study session for ${unitName}.`
  }
}

export function rescheduleMissedTasks(
  tasks: Array<{
    id: string
    date: Date
    isCompleted: boolean
    isRescheduled: boolean
    type: string
    title: string
    description: string
    unitId: string | null
    durationMinutes: number
    planId: string
  }>
): typeof tasks {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const missedTasks = tasks.filter(
    (t) => !t.isCompleted && !t.isRescheduled && new Date(t.date) < today
  )

  const rescheduled = missedTasks.map((task, i) => {
    let newDate = addDays(today, i + 1)
    while (isWeekend(newDate)) {
      newDate = addDays(newDate, 1)
    }
    return {
      ...task,
      date: newDate,
      isRescheduled: true,
    }
  })

  return rescheduled
}

export function calculateMastery(
  attempts: Array<{
    questionId: string
    isCorrect: boolean | null
    question?: { unitId: string }
  }>
): MasteryScore[] {
  const unitStats: Record<string, { total: number; correct: number }> = {}

  for (const attempt of attempts) {
    const unitId = attempt.question?.unitId
    if (!unitId) continue

    if (!unitStats[unitId]) {
      unitStats[unitId] = { total: 0, correct: 0 }
    }
    unitStats[unitId].total++
    if (attempt.isCorrect) {
      unitStats[unitId].correct++
    }
  }

  return Object.entries(unitStats).map(([unitId, stats]) => ({
    unitId,
    score: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
  }))
}
