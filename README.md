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
2. The `postCreateCommand` in `.devcontainer/devcontainer.json` automatically runs:
   ```bash
   npm install
   npx prisma db push
   npx prisma db seed
   ```
3. Run the dev server:
   ```bash
   npm run dev
   ```
4. Open the forwarded port `3000` in your browser.

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

## Collaborative Development & Merge Conflicts

### Why conflicts happen here

PrepBook is actively developed using **multiple Copilot coding agent sessions** alongside human contributors.  
Each session opens its own branch and pull request. When two sessions (or a session and a human) touch the **same file at the same time**, Git cannot automatically reconcile the differences — this is a merge conflict.

High-conflict-risk files in this repo:

| File / Path | Why it's high-risk |
|---|---|
| `prisma/schema.prisma` | Every feature that touches the data model modifies this single file |
| `prisma/seed.ts` | Questions, units, and rubric data all land here |
| `README.md` | Documentation updates from any session end up here |
| `src/app/layout.tsx` | Nav links change whenever a new page is added |
| `src/lib/planner.ts` | Core planner logic touched by scheduling and AI work |
| `.env.local.example` | New env vars appended from multiple directions |

---

### Best practices to avoid conflicts

**1. One feature per branch / PR**  
Keep each Copilot session or contributor focused on a single, clearly scoped feature (e.g., "add Unit 9 questions" or "fix planner date timezone bug"). Small PRs merge faster and conflict less.

**2. Sync with `main` before starting work**  
Always fetch and rebase (or merge) the latest `main` before opening a new session:
```bash
git fetch origin
git rebase origin/main   # or: git merge origin/main
```

**3. Split ownership of high-risk files**  
Coordinate so that only one session at a time modifies `schema.prisma`, `seed.ts`, or `layout.tsx`. Use GitHub Issues or PR descriptions to signal "I'm touching the schema."

**4. Merge open PRs before starting related work**  
If a PR that changes `schema.prisma` is already open, wait for it to merge (or explicitly build on top of that branch) before opening another PR that modifies the schema.

**5. Keep Prisma migrations atomic**  
Run `npx prisma migrate dev --name <descriptive-name>` once per schema change. Never hand-edit the generated migration SQL files; let Prisma regenerate them after a rebase.

---

### Resolving a conflict when it occurs

1. **Identify the conflicting PR** — GitHub will mark it "This branch has conflicts that must be resolved."

2. **Pull the target branch locally and rebase:**
   ```bash
   git fetch origin
   git checkout your-feature-branch
   git rebase origin/main
   ```

3. **Open each conflicted file** — Git marks conflicts like this:
   ```
   <<<<<<< HEAD
   // your changes
   =======
   // incoming changes from main
   >>>>>>> origin/main
   ```
   Edit the file to keep the correct combined result; remove all conflict markers.

4. **For `schema.prisma` conflicts** — keep all new model fields from both sides, then run:
   ```bash
   npx prisma generate
   npx prisma db push   # or: npx prisma migrate dev
   ```

5. **For `seed.ts` conflicts** — merge both sets of question/unit arrays, then re-seed:
   ```bash
   npx prisma db seed
   ```

6. **Stage, continue, and push:**
   ```bash
   git add .
   git rebase --continue
   git push --force-with-lease origin your-feature-branch
   ```

7. **Re-run the app** to confirm nothing broke:
   ```bash
   npm run dev
   ```

---

## Future Expansion

- **Additional AP subjects:** Add a `subject` field to `Unit` and `Question`; filter everywhere by subject.
- **External database:** Update `DATABASE_URL` + Prisma provider; run `prisma migrate deploy`.
- **AI scoring:** Implement `POST /api/submissions/[id]/score` calling an LLM with rubric criteria as a structured prompt.
- **Auth:** Add Clerk or NextAuth; replace `x-user-id` header with session tokens.
