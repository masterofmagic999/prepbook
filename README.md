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
- 🤖 **AI Planner & Feedback** — Set `GITHUB_TOKEN` to enable GitHub Models–powered planner notes and rubric feedback; falls back gracefully to deterministic output

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
| `GITHUB_TOKEN` | — | ❌ | GitHub PAT or Codespaces token — enables AI features |
| `GITHUB_MODELS_MODEL` | `gpt-4o-mini` | ❌ | Model ID from the GitHub Models catalogue |
| `GITHUB_MODELS_BASE_URL` | `https://models.inference.ai.azure.com` | ❌ | Override inference endpoint (advanced) |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | ❌ | Used for absolute URLs in emails/links |

Copy `.env.local.example` to `.env.local` and fill in your values.

---

## GitHub Models Setup

PrepBook uses [GitHub Models](https://github.com/marketplace/models) for AI-powered study planner notes and writing feedback. The integration is **optional** — the app works fully without it, using deterministic fallback text instead.

### In GitHub Codespaces (zero-config)

Codespaces automatically injects a `GITHUB_TOKEN` with the `models:read` scope. No extra setup is needed:

1. Open the repo in a Codespace.
2. Run the dev server (`npm run dev`).
3. AI features are active immediately.

To confirm, call the smoke-test endpoint:

```bash
curl http://localhost:3000/api/ai/test
# → { "provider": "github_models", "model": "gpt-4o-mini", "result": "..." }
```

### Local Development

1. **Create a Personal Access Token (PAT)**
   - Go to <https://github.com/settings/tokens> → **Fine-grained tokens** → **Generate new token**.
   - Under **Account permissions → GitHub Models**, set access to **Read**.
   - Copy the token value.

2. **Add the token to `.env.local`**

   ```bash
   cp .env.local.example .env.local
   ```

   Edit `.env.local`:

   ```env
   GITHUB_TOKEN="github_pat_..."
   GITHUB_MODELS_MODEL="gpt-4o-mini"   # or any model from the catalogue
   ```

3. **Restart the dev server** so the new env vars are picked up:

   ```bash
   npm run dev
   ```

4. **Verify the integration**

   ```bash
   curl http://localhost:3000/api/ai/test
   # → { "provider": "github_models", "model": "gpt-4o-mini", "result": "..." }
   ```

### Where secrets live

| Environment | Where to set `GITHUB_TOKEN` |
|-------------|----------------------------|
| Codespaces | Auto-injected — nothing to do |
| Local dev | `.env.local` (git-ignored) |
| Production / CI | Repository → **Settings → Secrets → Actions** |

> ⚠️ Never commit `.env.local` or any file containing real tokens. It is already listed in `.gitignore`.

### Choosing a model

Browse available models at <https://github.com/marketplace/models>. Set the model ID in `GITHUB_MODELS_MODEL`:

```env
GITHUB_MODELS_MODEL="gpt-4o"          # more capable, slower, higher quota cost
GITHUB_MODELS_MODEL="gpt-4o-mini"     # default — fast and quota-friendly
GITHUB_MODELS_MODEL="meta-llama-3-8b-instruct"  # open-source option
```

### Fallback behaviour

When `GITHUB_TOKEN` is absent or the API is unreachable:

- Planner tasks use deterministic description templates (same quality as before).
- Submission scoring uses word-count heuristics.
- **No errors are surfaced to users** — the app degrades silently.

The fallback is implemented in `src/lib/ai.ts` (`FallbackProvider`). You can call `GET /api/ai/test` to check which provider is active:

```json
{ "provider": "fallback", "model": null, "result": "Practice multiple choice..." }
```

### AI features powered by GitHub Models

| Feature | AI behaviour | Fallback |
|---------|-------------|---------|
| Planner task descriptions | GPT-generated, specific to unit & phase | Template strings |
| DBQ/LEQ rubric scoring | Per-criterion AI feedback | Word-count heuristics |

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
   - If `GITHUB_TOKEN` is set, enriches task titles/descriptions via GitHub Models; otherwise uses deterministic templates.

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
│       ├── ai.ts            # GitHub Models adapter + fallback provider
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
