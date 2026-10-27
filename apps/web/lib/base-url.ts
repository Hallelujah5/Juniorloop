/**
 * Absolute base URL for sitemap/robots. Self-healing order:
 * 1. NEXT_PUBLIC_BASE_URL when set and non-empty (|| treats '' as unset — an
 *    empty env var once shipped relative, spec-invalid sitemap URLs),
 * 2. Vercel's own production domain (survives project renames automatically),
 * 3. localhost for dev.
 */
export const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'http://localhost:3000')
