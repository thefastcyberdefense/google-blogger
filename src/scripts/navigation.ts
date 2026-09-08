export function initNavigation() {
  const toggle = document.getElementById('menu-toggle'); const nav = document.getElementById('primary-navigation');
  if (!toggle || !nav) return;
  const mobile = matchMedia('(max-width: 639px)');
  const sync = () => { const focused = nav.contains(document.activeElement); nav.hidden = mobile.matches; toggle.setAttribute('aria-expanded', String(!nav.hidden)); if (nav.hidden && focused) toggle.focus(); };
  toggle.hidden = false; sync(); mobile.addEventListener('change', sync);
  toggle.addEventListener('click', () => { nav.hidden = !nav.hidden; toggle.setAttribute('aria-expanded', String(!nav.hidden)); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && mobile.matches && !nav.hidden) { nav.hidden = true; toggle.setAttribute('aria-expanded', 'false'); toggle.focus(); } });
  // This is a non-modal disclosure, deliberately not a focus-trapping dialog.
}
