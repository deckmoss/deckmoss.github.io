const THRESHOLD = 50;

document.addEventListener('DOMContentLoaded', () => {
  'inner-post-page'
  const scroller = document.querySelector('.content');

  if (!scroller) {
    console.warn('Scroller not found');
    return;
  }

  function toggleFluid() {
    if (scroller.scrollTop > THRESHOLD) {
      document.body.classList.add('scrollToggle');
    } else {
      document.body.classList.remove('scrollToggle');
    }
  }

  scroller.addEventListener('scroll', toggleFluid, { passive: true });
  toggleFluid();
});