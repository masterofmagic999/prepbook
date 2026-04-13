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

> **Swapping the DB later:** Change `DATABASE_URL` in `.env.local` and update `datasource db { provider = "postgresql" }` in `prisma/schema.prisma`. Run `npx prisma migrate deploy`. No application logic changes needed.

---

## Features

- 📚 **Practice Hub** — MCQ, SAQ, DBQ, and LEQ practice by unit or mixed review
- 📝 **Writing Workspace** — Full-screen split editor with autosave, word count, timer, rubric checklist, and draft/final states
- 📅 **Personalized Study Planner** — Auto-generated daily tasks based on exam date, hours/week, and unit mastery; auto-reschedules missed tasks; pre-exam intensity mode in final 3 weeks
- 📊 **Review Center** — Per-unit mastery bars and incorrect-answer log with retry links
- 🎯 **Mastery Tracking** — Per-unit scores updated automatically from attempt history
- 🤖 **AI Providers** — Supports Cerebras Cloud, OpenRouter (free-tier models), and GitHub Models; falls back gracefully to deterministic output when no key is configured

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
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | ❌ | Used for absolute URLs in emails/links |
| `AI_PROVIDER` | _(auto)_ | ❌ | Force a specific provider: `github_models`, `openrouter`, or `cerebras`. Auto-detected from available keys when omitted. |
| `GITHUB_MODELS_TOKEN` | — | ❌ | GitHub PAT with `models:read` scope |
| `GITHUB_MODELS_ENDPOINT` | `https://models.inference.ai.azure.com` | ❌ | Override the GitHub Models inference endpoint |
| `GITHUB_MODELS_MODEL` | `gpt-4o-mini` | ❌ | GitHub Models model name |
| `OPENROUTER_API_KEY` | — | ❌ | OpenRouter API key (free models available) |
| `OPENROUTER_MODEL` | `meta-llama/llama-3.1-8b-instruct:free` | ❌ | OpenRouter model name |
| `OPENROUTER_BASE_URL` | `https://openrouter.ai/api/v1` | ❌ | Override OpenRouter base URL |
| `OPENROUTER_SITE_URL` | — | ❌ | Site URL sent in `HTTP-Referer` header |
| `OPENROUTER_APP_NAME` | `PrepBook` | ❌ | App name sent in `X-Title` header |
| `CEREBRAS_API_KEY` | — | ❌ | Cerebras Cloud API key |
| `CEREBRAS_MODEL` | `llama3.1-8b` | ❌ | Cerebras model name |
| `CEREBRAS_BASE_URL` | `https://api.cerebras.ai/v1` | ❌ | Override Cerebras base URL |

Copy `.env.local.example` to `.env.local` and fill in your values.

> **⚠️ Note on `enviorment.env`:** An older file named `enviorment.env` (misspelled) exists in the repo root. It is now gitignored and should not be used. Copy `.env.local.example` to `.env.local` instead — this is the file Next.js loads automatically.

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

## AI Integration

PrepBook supports three AI providers. All are optional — every feature works in deterministic fallback mode when no keys are configured.

### Provider auto-detection

The app picks the first provider whose key is present: **GitHub Models → OpenRouter → Cerebras**. Override with `AI_PROVIDER` in `.env.local`.

### GitHub Models

No OpenAI account needed — just a GitHub token.

1. Go to **GitHub → Settings → Personal access tokens → Fine-grained tokens**.
2. Create a token with the **`models:read`** scope.
3. Add to `.env.local`:
   ```
   GITHUB_MODELS_TOKEN="github_pat_..."
   ```

### OpenRouter (free models available)

OpenRouter gives access to many models including free-tier ones.

1. Sign up at [openrouter.ai](https://openrouter.ai) and create an API key.
2. Add to `.env.local`:
   ```
   AI_PROVIDER="openrouter"
   OPENROUTER_API_KEY="sk-or-..."
   # Optional: pick a specific free model
   # OPENROUTER_MODEL="meta-llama/llama-3.1-8b-instruct:free"
   ```

### Cerebras Cloud

Cerebras offers fast inference with generous free credits.

1. Sign up at [cloud.cerebras.ai](https://cloud.cerebras.ai) and create an API key.
2. Add to `.env.local`:
   ```
   AI_PROVIDER="cerebras"
   CEREBRAS_API_KEY="your_key_here"
   # Optional: choose model and endpoint
   # CEREBRAS_MODEL="llama3.1-8b"
   ```

### AI features

| Feature | Route | Behavior without AI |
|---------|-------|---------------------|
| DBQ/LEQ submission feedback | `POST /api/submissions/[id]/submit` | Falls back to word-count heuristics |

### Disable AI / fallback mode

Leave all AI keys blank. Every feature continues to work using deterministic rule-based logic.

### Troubleshooting

- **`401 Unauthorized`** — Key is invalid or expired. Check the key for the active provider.
- **`429 Rate limit`** — Free-tier quota hit; wait or switch providers/models.
- **No AI feedback after submitting** — Check server logs for `API error` entries.
- **Wrong provider being used** — Set `AI_PROVIDER` explicitly to override auto-detection.

---

## Planner Dates & Timezones

Tasks are stored with **UTC noon** timestamps (`12:00:00 UTC`). This ensures the calendar date is identical in every timezone from UTC−12 to UTC+12 with no day-boundary shift.

The planner UI reads dates using UTC components (`getUTCDate()` etc.) so "Today" is always the correct local calendar day regardless of where the server or browser runs.

**If tasks appear a day early/late after upgrading:**
Regenerate your study plan (click **Regenerate Plan**) to replace old midnight-UTC tasks with the noon-UTC format.

---

**Location:** `src/lib/planner.ts`

The planner uses a **hybrid deterministic + AI approach**:

1. **`generateStudyPlan(params)`** — Takes `examDate`, `hoursPerWeek`, `targetScore`, and `masteryScores` array; returns an array of `StudyTask` objects covering every day until the exam.
   - Prioritizes weak units (low mastery score).
   - Balances mode mix: ~30% MCQ, ~25% SAQ, ~25% DBQ, ~20% LEQ.
   - Activates **pre-exam intensity mode** in the final 3 weeks (more timed MCQ/mixed sets).
   - All task dates are stored at **UTC noon** to avoid timezone day-boundary issues.

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
│       ├── ai.ts            # Multi-provider AI service (GitHub Models / OpenRouter / Cerebras)
│       └── hooks.ts         # React hooks (useUserId, etc.)
├── .devcontainer/
│   └── devcontainer.json    # Codespaces config
├── .env.local.example       # Environment variable template
└── README.md
```

---

## Feature Ideas (Backlog)

The following are prioritized next features, roughly highest-to-lowest impact:

| Priority | Feature | Notes |
|----------|---------|-------|
| 🔴 High | **AI-adaptive planner** — Re-rank units each week based on recent attempt accuracy | Extend `calculateMastery` + weekly re-gen |
| 🔴 High | **Timed MCQ mini-tests** — 10-question timed sets per unit with instant scoring | New `/practice/timed` route |
| 🟡 Medium | **Flashcard mode** — Spaced-repetition review of key terms by unit | Deck data from `Question.explanation` |
| 🟡 Medium | **Streak & habit tracking** — Daily completion streaks on the dashboard | `completedAt` already stored |
| 🟡 Medium | **AI essay outline assistant** — Generate a structured outline before writing | Pre-fill workspace via GitHub Models |
| 🟢 Low | **Teacher/parent view** — Read-only dashboard sharing via a link token | New `shareToken` on User |
| 🟢 Low | **PWA / offline mode** — Cache practice sets for offline use | `next-pwa` plugin |
| 🟢 Low | **Additional AP subjects** — AP US History, AP European History | `subject` field on Unit + Question |

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
- **Auth:** Add Clerk or NextAuth; replace `x-user-id` header with session tokens.
