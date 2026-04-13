import { PrismaClient } from '@prisma/client'

if (!process.env.DATABASE_URL) {
  console.error(
    '[PrepBook] WARNING: DATABASE_URL environment variable is not set.\n' +
    '  Run: cp .env.local.example .env.local\n' +
    '  Then restart the dev server.\n' +
    '  See README.md for setup instructions.'
  )
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query'] : [],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
