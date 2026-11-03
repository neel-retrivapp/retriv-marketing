// Mobile nav toggle
const hamburger = document.querySelector('.nav-hamburger');
const navLinks  = document.querySelector('.nav-links');

hamburger.addEventListener('click', function () {
  const isOpen = navLinks.classList.toggle('nav-open');
  this.setAttribute('aria-expanded', isOpen);
});

// Close on any nav link click
navLinks.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => {
    navLinks.classList.remove('nav-open');
    hamburger.setAttribute('aria-expanded', 'false');
  });
});

// Close on outside click
document.addEventListener('click', e => {
  if (!e.target.closest('.nav')) {
    navLinks.classList.remove('nav-open');
    hamburger.setAttribute('aria-expanded', 'false');
  }
});
