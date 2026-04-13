<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:merge-conflict-rules -->
## Merge conflict rules for agent sessions

Multiple Copilot coding agent sessions may run concurrently in this repo. Follow these rules to minimise conflicts:

1. **Sync before you start.** Run `git fetch origin && git rebase origin/main` at the very beginning of every session before touching any file.

2. **One concern per session.** Scope your changes to a single feature or bug fix. Do not refactor unrelated code while implementing a feature.

3. **Avoid simultaneous edits to high-risk files.**  
   Only touch the files listed below when the current open PRs do *not* already modify them.  
   High-risk files: `prisma/schema.prisma`, `prisma/seed.ts`, `src/app/layout.tsx`, `src/lib/planner.ts`, `.env.local.example`, `README.md`.

4. **Schema changes are atomic.** If you must modify `prisma/schema.prisma`, run `npx prisma migrate dev --name <descriptive-name>` immediately after and include the generated migration file in the same PR. Never split schema edits across multiple PRs.

5. **Signal intent in your PR description.** If you are modifying a high-risk file, say so at the top of the PR body so other sessions and human contributors know not to touch the same file.

6. **Rebase — don't merge — when syncing.** Use `git rebase origin/main` rather than `git merge origin/main` to keep a linear history and make conflicts easier to spot.

7. **Resolve conflicts immediately.** If your branch falls behind `main` and GitHub reports a conflict, resolve it before asking for a review. See the "Resolving a conflict" steps in `README.md`.
<!-- END:merge-conflict-rules -->

