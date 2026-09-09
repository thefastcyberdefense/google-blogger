export function matchesQuery(text: string, query: string) { const haystack = text.normalize('NFKC').toLocaleLowerCase(); return query.normalize('NFKC').toLocaleLowerCase().trim().split(/\s+/u).every(term => haystack.includes(term)); }
export function initSearch() {
  const input = document.querySelector<HTMLInputElement>('#search-query');
  const cards = Array.from(document.querySelectorAll<HTMLElement>('[data-filter-card]'));
  const status = document.getElementById('filter-status');
  if (!input) return;
  const entries = cards.map(card => ({ card, container: card.closest<HTMLElement>('.post-outer-container') || card, text: card.textContent || '' }));
  const streams = new Set(entries.map(({card})=>card.closest<HTMLElement>('.blog-posts')).filter((stream):stream is HTMLElement=>!!stream));
  const filter = () => {
    if (!entries.length || !status) return;
    const active=!!input.value.trim();streams.forEach(stream=>{stream.dataset.filterActive=String(active);});
    let visible = 0;
    entries.forEach(({ container, text }) => { const match = matchesQuery(text, input.value); container.hidden = !match; if (match) visible++; });
    status.hidden = !active;
    status.textContent = `${visible} of ${entries.length} loaded articles match. Submit Search blog to search the full publication.`;
  };
  input.addEventListener('input',filter);input.form?.addEventListener('reset',()=>queueMicrotask(filter));filter();
  document.addEventListener('keydown', event => {
    const target = event.target;
    if (event.isComposing || target instanceof Element && target.closest('input,textarea,select,[contenteditable]:not([contenteditable="false"])')) return;
    if (event.key === '/' && !event.metaKey && !event.ctrlKey && !event.altKey || event.key.toLowerCase() === 'k' && (event.ctrlKey || event.metaKey) && !event.altKey) {
      event.preventDefault();
      const menu = document.getElementById('primary-navigation'); const toggle = document.getElementById('menu-toggle');
      if (menu?.hidden) { menu.hidden = false; toggle?.setAttribute('aria-expanded', 'true'); }
      input.focus();
    }
  });
}
