# PrepBook — AP World History Practice Hub

A full-stack MVP for AP World History exam preparation featuring unit-based MCQ/SAQ/DBQ/LEQ practice, a writing workspace, personalized study planner, and unit mastery tracking — with SQLite persistence that works in GitHub Codespaces out of the box.

## Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | Next.js 14 App Router + TypeScript | Full-stack, file-based routing |
| ORM | Prisma | Type-safe queries, easy migrations |
| Database | SQLite (via `prisma/dev.db`) | Zero-config, works in Codespaces |
| Styling | Tailwind CSS | Utility-first, fast iteration |
| Icons | lucide-react | Lightweight icon set |

> **Swapping the DB later:** Change `DATABASE_URL` in `.env` and update `datasource db { provider = "postgresql" }` in `prisma/schema.prisma`. Run `npx prisma migrate deploy`. No application logic changes needed.

---

## Features

- 📚 **Practice Hub** — MCQ, SAQ, DBQ, and LEQ practice by unit or mixed review
- 📝 **Writing Workspace** — Full-screen split editor with autosave, word count, timer, rubric checklist, and draft/final states
- 📅 **Personalized Study Planner** — Auto-generated daily tasks based on exam date, hours/week, and unit mastery; auto-reschedules missed tasks; pre-exam intensity mode in final 3 weeks
- 📊 **Review Center** — Per-unit mastery bars and incorrect-answer log with retry links
- 🎯 **Mastery Tracking** — Per-unit scores updated automatically from attempt history
- 🤖 **AI Hook** — Set `OPENAI_API_KEY` to enrich planner task descriptions; falls back gracefully to deterministic output

---

## Quick Start (GitHub Codespaces)

1. Click **Code → Open with Codespaces → New codespace** in the GitHub repo.
2. Wait for the container to finish the `postCreateCommand` setup (visible in the terminal panel). It automatically runs:
   ```bash
   npm install
   cp -n .env.local.example .env.local
   npx prisma generate
   npx prisma db push
   npx prisma db seed
   ```
3. The dev server starts **automatically** via `postStartCommand`. The **Ports** tab (bottom panel) will show port `3000` with a globe icon once it's ready.
4. Click the globe icon next to port `3000`, or open the **Simple Browser** preview that pops up automatically.

> **If the dev server is not running** (e.g., you stopped it), restart it from the terminal:
> ```bash
> npm run dev
> ```

---

### Troubleshooting HTTP 502 in Codespaces

A **502 Bad Gateway** on the `*.app.github.dev` URL means the forwarding proxy couldn't reach the app. Work through these steps:

#### 1. Make sure the dev server is running
Open a terminal in the Codespace and check:
```bash
# Check if Next.js is listening
curl -s http://localhost:3000/api/health
# Expected: {"status":"ok","database":"ok",...}
```
If you get "Connection refused", start the server:
```bash
npm run dev
```
Wait for `✓ Ready` in the output, then refresh the browser tab.

#### 2. Database not initialized
If `curl http://localhost:3000/api/health` returns `{"database":"error",...}`, the database needs to be set up:
```bash
cp -n .env.local.example .env.local
npx prisma generate
npx prisma db push
npx prisma db seed
npm run dev
```

#### 3. Environment variable missing
Confirm `.env.local` exists and contains `DATABASE_URL`:
```bash
cat .env.local
# Should show: DATABASE_URL="file:./dev.db"
```
If the file is missing:
```bash
cp .env.local.example .env.local
```
Then restart the dev server.

#### 4. Port visibility
In the **Ports** tab, make sure port `3000` visibility is set to **Private** or **Public** (not just "localhost"). Right-click the port row and change visibility if needed.

---

## Local Development

```bash
# 1. Clone the repo
git clone https://github.com/masterofmagic999/prepbook
cd prepbook

# 2. Install dependencies
npm install

# 3. Set up environment
cp .env.local.example .env.local   # edit if needed; default works for SQLite

# 4. Create and migrate the database
npx prisma db push

# 5. Seed AP World History units + sample questions
npx prisma db seed

# 6. Start the dev server
npm run dev
# → http://localhost:3000
```

---

## Environment Variables

| Variable | Default | Required | Description |
|----------|---------|----------|-------------|
| `DATABASE_URL` | `file:./dev.db` | ✅ | SQLite path or Postgres connection string |
| `OPENAI_API_KEY` | — | ❌ | Enables AI-enriched planner descriptions |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | ❌ | Used for absolute URLs in emails/links |

Copy `.env.local.example` to `.env.local` and fill in your values.

---

## Database Commands

```bash
# Apply schema changes (development)
npx prisma db push

# Generate Prisma Client after schema changes
npx prisma generate

# Seed / re-seed the database
npx prisma db seed

# Open Prisma Studio (visual DB browser)
npx prisma studio

# Create a migration file (production workflow)
npx prisma migrate dev --name <migration-name>
```

---

## AP World History Units

| # | Unit Name | Time Period |
|---|-----------|-------------|
| 1 | The Global Tapestry | 1200–1450 |
| 2 | Networks of Exchange | 1200–1450 |
| 3 | Land-Based Empires | 1450–1750 |
| 4 | Transoceanic Interconnections | 1450–1750 |
| 5 | Revolutions | 1750–1900 |
| 6 | Consequences of Industrialization | 1750–1900 |
| 7 | Global Conflict | 1900–1945 |
| 8 | Cold War and Decolonization | 1945–1980 |
| 9 | Globalization | 1980–present |

---

## Adding Questions

Edit `prisma/seed.ts`. Each question entry looks like:

```typescript
{
  unitId: units[0].id,           // Unit 1
  type: 'MCQ',
  prompt: 'Which of the following best explains...',
  choices: JSON.stringify(['A) ...', 'B) ...', 'C) ...', 'D) ...']),
  correctAnswer: 'A) ...',
  explanation: 'The answer is A because...',
  historicalThinkingSkill: 'causation',
  difficulty: 2,                 // 1–5
  timePeriod: '1200-1450',
}
```

After editing, re-seed:

```bash
npx prisma db seed
```

To add via API (programmatically), `POST /api/questions` with the same fields.

---

## Uploading Rubrics

Rubrics are stored in the `Rubric` and `RubricCriterion` tables. To add a new rubric:

```typescript
// POST /api/rubrics  (not yet exposed as UI, use Prisma Studio or direct insert)
const rubric = await prisma.rubric.create({
  data: {
    id: 'rubric_dbq_v2',
    questionType: 'DBQ',
    version: '2',
    name: 'DBQ Rubric 2025',
    description: 'Official College Board DBQ rubric',
    criteria: {
      create: [
        { name: 'Thesis/Claim', description: '...', maxPoints: 1, orderIndex: 0 },
        { name: 'Contextualization', description: '...', maxPoints: 1, orderIndex: 1 },
        // ...
      ]
    }
  }
})
```

---

## Planner Logic

**Location:** `src/lib/planner.ts`

The planner uses a **hybrid deterministic + AI approach**:

1. **`generateStudyPlan(params)`** — Takes `examDate`, `hoursPerWeek`, `targetScore`, and `masteryScores` array; returns an array of `StudyTask` objects covering every day until the exam.
   - Prioritizes weak units (low mastery score).
   - Balances mode mix: ~30% MCQ, ~25% SAQ, ~25% DBQ, ~20% LEQ.
   - Activates **pre-exam intensity mode** in the final 3 weeks (more timed MCQ/mixed sets).
   - If `OPENAI_API_KEY` is set, enriches task titles/descriptions via OpenAI; otherwise uses deterministic templates.

2. **`rescheduleMissedTasks(tasks)`** — Takes the task list, finds incomplete past-due tasks, and reassigns them to the earliest available future slot.

3. **`calculateMastery(attempts)`** — Computes per-unit mastery as `(correct / total) * 100` weighted by recency.

---

## Project Structure

```
prepbook/
├── prisma/
│   ├── schema.prisma        # Data models
│   ├── seed.ts              # Units + questions seed
│   └── dev.db               # SQLite file (git-ignored)
├── src/
│   ├── app/
│   │   ├── api/             # API route handlers
│   │   │   ├── attempts/
│   │   │   ├── mastery/
│   │   │   ├── planner/
│   │   │   ├── profile/
│   │   │   ├── questions/
│   │   │   ├── submissions/
│   │   │   ├── units/
│   │   │   └── users/
│   │   ├── dashboard/       # Dashboard page
│   │   ├── onboarding/      # Multi-step onboarding
│   │   ├── practice/        # Practice hub + session
│   │   ├── planner/         # Study planner page
│   │   ├── review/          # Review center
│   │   ├── workspace/       # DBQ/LEQ writing editor
│   │   ├── layout.tsx       # Root layout + nav
│   │   └── page.tsx         # Root redirect
│   └── lib/
│       ├── prisma.ts        # Prisma client singleton
│       ├── planner.ts       # Planner generation logic
│       └── hooks.ts         # React hooks (useUserId, etc.)
├── .devcontainer/
│   └── devcontainer.json    # Codespaces config
├── .env.local.example       # Environment variable template
└── README.md
```

---

## Future Expansion

- **Additional AP subjects:** Add a `subject` field to `Unit` and `Question`; filter everywhere by subject.
- **External database:** Update `DATABASE_URL` + Prisma provider; run `prisma migrate deploy`.
- **AI scoring:** Implement `POST /api/submissions/[id]/score` calling an LLM with rubric criteria as a structured prompt.
- **Auth:** Add Clerk or NextAuth; replace `x-user-id` header with session tokens.
