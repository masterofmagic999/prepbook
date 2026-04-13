export function register() {
  if (!process.env.DATABASE_URL) {
    console.error(
      '\n[PrepBook] ⚠️  WARNING: DATABASE_URL environment variable is not set.' +
      '\n  The app will start but database queries will fail.' +
      '\n  Fix: run  cp .env.local.example .env.local  and restart the dev server.' +
      '\n  See README.md → Troubleshooting HTTP 502 for details.\n'
    )
  } else {
    const url = process.env.DATABASE_URL
    const safe = url.startsWith('file:') ? url : url.replace(/:\/\/[^@]*@/, '://<credentials>@')
    console.log('[PrepBook] ✓ DATABASE_URL is set. Database:', safe)
  }
}
