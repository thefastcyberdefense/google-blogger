export function safePostUrl(value: unknown, base: string): string | null {
  if (typeof value !== 'string' || /[-\u001f\u007f]/u.test(value)) return null;
  try { const url = new URL(value, base); const origin = new URL(base); return url.protocol === 'https:' && url.origin === origin.origin && !url.username && !url.password ? url.href : null; } catch { return null; }
}
export function announce(text: string) { const el = document.getElementById('fcd-status'); if (el) el.textContent = text; }
