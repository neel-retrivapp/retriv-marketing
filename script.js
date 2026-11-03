// ═══ CONFIG ════════════════════════════════════════════════════
// TODO(waitlist): set this to the early-access provider's endpoint before
// launch (Formspree, Mailchimp/Kit, our own API, …). The form POSTs JSON:
//   { email, persona, source: 'retriv.app' }
// and treats any 2xx response as success. While it's empty, the live site
// asks people to email hello@retriv.app instead of silently dropping them
// (on localhost it simulates success so the flow can be reviewed).
const WAITLIST_ENDPOINT = '';
// ═══════════════════════════════════════════════════════════════

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

// ─── Early-access form ──────────────────────────────────────────
(function () {
  const form = document.querySelector('[data-waitlist]');
  if (!form) return;
  const email = form.querySelector('#email');
  const emailError = form.querySelector('#email-error');
  const formError = form.querySelector('.form-error');
  const button = form.querySelector('button[type="submit"]');
  const success = document.querySelector('.signup-success');
  const buttonLabel = button.textContent;
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  let attempted = false;

  const emailProblem = () => {
    const value = email.value.trim();
    if (!value) return 'Enter your email address.';
    if (!EMAIL_RE.test(value)) return 'Enter a valid email address, like name@example.com.';
    return '';
  };
  const showEmailError = (message) => {
    emailError.textContent = message;
    emailError.hidden = !message;
    email.setAttribute('aria-invalid', String(!!message));
  };
  const showFormError = (message) => {
    formError.textContent = message;
    formError.hidden = !message;
  };
  const setLoading = (loading) => {
    button.disabled = loading;
    button.setAttribute('aria-busy', String(loading));
    button.textContent = loading ? 'Joining…' : buttonLabel;
  };

  // Re-validate as they type once they've tried to submit
  email.addEventListener('input', () => { if (attempted) showEmailError(emailProblem()); });

  async function send(payload) {
    if (!WAITLIST_ENDPOINT) {
      if (['localhost', '127.0.0.1'].includes(location.hostname)) {
        console.warn('[waitlist] WAITLIST_ENDPOINT not set — simulating success on localhost', payload);
        await new Promise((r) => setTimeout(r, 700));
        return;
      }
      throw new Error("Early-access sign-ups aren't open just yet. Email hello@retriv.app and we'll add you to the list.");
    }
    let res;
    try {
      res = await fetch(WAITLIST_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch {
      throw new Error("We couldn't reach the server. Check your connection and try again.");
    }
    if (!res.ok) throw new Error('Something went wrong on our side. Please try again in a moment.');
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    attempted = true;
    showFormError('');
    const problem = emailProblem();
    showEmailError(problem);
    if (problem) { email.focus(); return; }
    // Spam trap filled in: pretend it worked and drop it
    if (form.website.value) { form.hidden = true; success.hidden = false; return; }

    setLoading(true);
    try {
      await send({ email: email.value.trim(), persona: form.persona.value || null, source: 'retriv.app' });
      form.hidden = true;
      success.hidden = false;
      success.focus();
    } catch (err) {
      showFormError(err.message);
      setLoading(false);
    }
  });
})();
