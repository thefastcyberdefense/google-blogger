import { safePostUrl } from './safe-dom.ts';
export type FeedPost = { title: string; url: string };
export function parseFeed(data: unknown, base: string): FeedPost[] {
  if (!data || typeof data !== 'object') return [];
  const entries = (data as {feed?: {entry?: unknown}}).feed?.entry;
  if (!Array.isArray(entries)) return [];
  const seen = new Set<string>(); const result: FeedPost[] = [];
  for (const value of entries.slice(0, 20)) {
    if (!value || typeof value !== 'object') continue;
    const entry = value as {title?: {$t?: unknown}; link?: {rel?: unknown; href?: unknown}[]};
    const title = entry.title?.$t; const link = Array.isArray(entry.link) ? entry.link.find(l => l?.rel === 'alternate') : undefined;
    const url = safePostUrl(link?.href, base);
    if (typeof title !== 'string' || !title.trim() || !url || seen.has(url)) continue;
    seen.add(url); result.push({ title: title.trim().slice(0, 300), url });
    if (result.length === 5) break;
  }
  return result;
}
export async function initRecentPosts() {
  const list = document.querySelector<HTMLOListElement>('#recent-posts'); const status = document.getElementById('recent-status');
  if (!list || !status || !list.dataset.feed) return;
  const safe = safePostUrl(list.dataset.feed, location.href); if (!safe) return;
  const url = new URL(safe); url.searchParams.set('alt', 'json'); url.searchParams.set('max-results', '8');
  status.textContent = 'Loading recent posts…';
  try {
    const response = await fetch(url, { credentials: 'omit', signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error('Feed unavailable');
    const declared = Number(response.headers.get('content-length'));
    if (declared > 500000) throw new Error('Feed too large');
    const reader = response.body?.getReader(); if (!reader) throw new Error('No feed body');
    const chunks: Uint8Array[] = []; let bytes = 0;
    while (true) { const { value, done } = await reader.read(); if (done) break; bytes += value.length; if (bytes > 500000) { await reader.cancel(); throw new Error('Feed too large'); } chunks.push(value); }
    const merged = new Uint8Array(bytes); let offset = 0; for (const chunk of chunks) { merged.set(chunk, offset); offset += chunk.length; }
    const posts = parseFeed(JSON.parse(new TextDecoder().decode(merged)), location.href);
    const fragment = document.createDocumentFragment();
    posts.forEach(post => { const li = document.createElement('li'); const link = document.createElement('a'); link.href = post.url; link.textContent = post.title; li.append(link); fragment.append(li); });
    list.replaceChildren(fragment); status.textContent = posts.length ? 'Newest publications' : 'No recent posts available. Browse the publication below.';
  } catch { status.textContent = 'Recent posts could not be loaded. Browse the latest articles below.'; }
}
