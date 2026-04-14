# Materials Folder

Place your AP World History study materials here as `.txt` or `.md` files.

## Format

- Plain text (`.txt`) or Markdown (`.md`) files
- Any formatting — the ingestion script will parse paragraphs
- File names can be anything (e.g., `unit1-notes.txt`, `unit5-industrialization.md`)

## Running ingestion

```bash
npm run ingest
```

Generated questions will be saved to `data/questions.json`.

Add `AI_PROVIDER` + API key in `.env.local` for AI-enhanced question generation.
Without a key, the script uses deterministic extraction as a fallback.
