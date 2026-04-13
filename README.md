# PrepBook — AP World History Practice Hub

A full-stack MVP for AP World History exam preparation.

## Tech Stack
- **Next.js 14** App Router + TypeScript
- **Prisma ORM** + SQLite
- **Tailwind CSS**

## Features
- 📚 **Practice Hub** — MCQ, SAQ, DBQ, and LEQ practice modes
- 📝 **Writing Workspace** — Full-screen editor with autosave, rubric checklist, and scoring
- 📅 **Study Planner** — Auto-generated personalized study schedule
- 📊 **Review Center** — Unit mastery tracking and incorrect answer review
- 🎯 **Mastery Tracking** — Per-unit progress with automatic score updates

## Setup

```bash
# Install dependencies
npm install

# Set up database
npx prisma db push
npx prisma db seed

# Start development server
npm run dev
```

## Environment Variables

Copy `.env.local.example` to `.env.local` and fill in:

```env
DATABASE_URL="file:./prisma/dev.db"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## Units Covered

| # | Unit | Period |
|---|------|--------|
| 1 | The Global Tapestry | 1200–1450 |
| 2 | Networks of Exchange | 1200–1450 |
| 3 | Land-Based Empires | 1450–1750 |
| 4 | Transoceanic Interconnections | 1450–1750 |
| 5 | Revolutions | 1750–1900 |
| 6 | Consequences of Industrialization | 1750–1900 |
| 7 | Global Conflict | 1900–1945 |
| 8 | Cold War and Decolonization | 1945–1980 |
| 9 | Globalization | 1980–present |
