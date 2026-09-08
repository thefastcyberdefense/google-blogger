export function safePostUrl(value: unknown, base: string): string | null {
  if (typeof value !== 'string') return null;
  // Character codes avoid accidental corruption of escaped ranges during serialization.
  if (Array.from(value).some(char => { const code = char.charCodeAt(0); return code <= 31 || code === 127; })) return null;
  try {
    const url = new URL(value, base);
    const origin = new URL(base);
    return url.protocol === 'https:' && url.origin === origin.origin && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}
export function announce(text: string) { const el = document.getElementById('fcd-status'); if (el) el.textContent = text; }
