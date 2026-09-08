export function initTheme() {
  const button = document.getElementById('theme-toggle'); if (!button) return;
  const root = document.documentElement; const media = matchMedia('(prefers-color-scheme: dark)');
  const isDark = () => root.dataset.theme ? root.dataset.theme === 'dark' : media.matches;
  const label = () => button.setAttribute('aria-label', `Switch to ${isDark() ? 'light' : 'dark'} theme`);
  button.hidden = false; label(); media.addEventListener('change', label);
  button.addEventListener('click', () => { root.dataset.theme = isDark() ? 'light' : 'dark'; try { localStorage.setItem('fcd-theme', root.dataset.theme); } catch {} label(); });
}
