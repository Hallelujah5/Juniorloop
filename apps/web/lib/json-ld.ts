/**
 * Serialize JSON-LD for an inline <script>. JSON.stringify leaves "<" alone, so a
 * scraped title containing "</script><script>…" would close the tag and run on
 * our origin. Escaping the three HTML-significant characters as JSON \u escapes
 * keeps the payload valid JSON and inert inside the script element.
 */
export function jsonLd(data: unknown): { __html: string } {
  const html = JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
  return { __html: html }
}
