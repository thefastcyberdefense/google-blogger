export function matchesQuery(text: string, query: string) { const haystack = text.normalize('NFKC').toLocaleLowerCase(); return query.normalize('NFKC').toLocaleLowerCase().trim().split(/\s+/u).every(term => haystack.includes(term)); }
export function initSearch() {
  const input = document.querySelector<HTMLInputElement>('#search-query');
  const cards = Array.from(document.querySelectorAll<HTMLElement>('[data-filter-card]'));
  const status = document.getElementById('filter-status');
  if (!input) return;
  const entries = cards.map(card => ({ card, container: card.closest<HTMLElement>('.post-outer-container') || card, text: card.textContent || '' }));
  input.addEventListener('input', () => {
    if (!entries.length || !status) return;
    let visible = 0;
    entries.forEach(({ container, text }) => { const match = matchesQuery(text, input.value); container.hidden = !match; if (match) visible++; });
    status.hidden = !input.value.trim();
    status.textContent = `${visible} of ${entries.length} loaded articles match. Submit Search blog to search the full publication.`;
  });
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
