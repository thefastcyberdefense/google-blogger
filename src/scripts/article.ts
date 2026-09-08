import { announce } from './safe-dom.ts';
export function initArticle() {
  const body = document.getElementById('article-body'); if (!body) return;
  const reading = document.getElementById('reading-time'); const words = (body.textContent || '').trim().split(/\s+/u).filter(Boolean).length;
  if (reading && words) { reading.textContent = `${Math.max(1, Math.ceil(words / 220))} min read`; reading.hidden = false; }
  const copyLink = document.getElementById('copy-link');
  if (copyLink) { copyLink.hidden = false; copyLink.addEventListener('click', async () => { try { const url = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href || location.href; await navigator.clipboard.writeText(url); announce('Article link copied'); } catch { announce('Copy unavailable. Copy the address from your browser.'); } }); }
  const headings = Array.from(body.querySelectorAll<HTMLElement>('h2,h3,h4')); if (headings.length < 2) return;
  const details = document.createElement('details'); details.className = 'article-toc';
  const summary = document.createElement('summary'); summary.textContent = 'On this page'; details.append(summary);
  const nav = document.createElement('nav'); nav.setAttribute('aria-label', 'Table of contents'); const list = document.createElement('ol'); nav.append(list); details.append(nav);
  const used = new Set(Array.from(document.querySelectorAll('[id]'), el => el.id)); const links = new Map<Element, HTMLAnchorElement>();
  headings.forEach((heading, index) => {
    if (!heading.id || document.querySelectorAll(`[id="${CSS.escape(heading.id)}"]`).length > 1) { let id = `fcd-section-${index + 1}`; while (used.has(id)) id += '-heading'; heading.id = id; used.add(id); }
    heading.tabIndex = -1;
    const li = document.createElement('li'); const a = document.createElement('a'); a.href = `#${encodeURIComponent(heading.id)}`; a.textContent = heading.textContent || `Section ${index + 1}`;
    a.addEventListener('click', () => { heading.focus({ preventScroll: true }); }); li.append(a); list.append(li); links.set(heading, a);
  });
  body.before(details);
  if ('IntersectionObserver' in window) { const observer = new IntersectionObserver(entries => { for (const entry of entries) if (entry.isIntersecting) { links.forEach(a => a.removeAttribute('aria-current')); links.get(entry.target)?.setAttribute('aria-current', 'location'); } }, { rootMargin: '0px 0px -65% 0px' }); headings.forEach(h => observer.observe(h)); }
}
