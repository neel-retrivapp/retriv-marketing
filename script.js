// ─── Mobile menu ────────────────────────────────────────────────
(function () {
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('site-nav');
  if (!toggle || !nav) return;

  const setOpen = (open) => {
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
  };

  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
  document.addEventListener('click', (e) => { if (!e.target.closest('.site-header')) setOpen(false); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      setOpen(false);
      toggle.focus();
    }
  });
})();

// ─── Persona tabs (WAI-ARIA tabs, automatic activation) ─────────
(function () {
  document.querySelectorAll('[data-tabs]').forEach((root) => {
    const tabs = [...root.querySelectorAll('[role="tab"]')];
    const panels = tabs.map((t) => document.getElementById(t.getAttribute('aria-controls')));

    const select = (index, focus) => {
      tabs.forEach((tab, i) => {
        const on = i === index;
        tab.setAttribute('aria-selected', String(on));
        tab.tabIndex = on ? 0 : -1;
        panels[i].classList.toggle('is-active', on);
        // Hidden panels keep their space (no layout shift) but can't be reached
        panels[i].inert = !on;
      });
      if (focus) tabs[index].focus();
    };

    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => select(i, false));
      tab.addEventListener('keydown', (e) => {
        const last = tabs.length - 1;
        const next = { ArrowRight: i === last ? 0 : i + 1, ArrowDown: i === last ? 0 : i + 1,
                       ArrowLeft: i === 0 ? last : i - 1, ArrowUp: i === 0 ? last : i - 1,
                       Home: 0, End: last }[e.key];
        if (next === undefined) return;
        e.preventDefault();
        select(next, true);
      });
    });

    select(Math.max(0, tabs.findIndex((t) => t.getAttribute('aria-selected') === 'true')), false);
  });
})();

// ─── Persona links preselect "What best describes you?" ─────────
document.addEventListener('click', (e) => {
  const link = e.target.closest('[data-persona]');
  const field = document.getElementById('persona');
  if (link && field) field.value = link.dataset.persona;
});
