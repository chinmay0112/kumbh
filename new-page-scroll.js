(() => {
  // Keep native scrolling when the CDN is unavailable or reduced motion is requested.
  if (typeof window.Lenis !== 'function') return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let lenis = null;
  let ticker = null;
  const dialogs = document.querySelectorAll('dialog');
  dialogs.forEach(dialog => dialog.setAttribute('data-lenis-prevent', ''));

  function syncDialogs() {
    if (!lenis) return;
    if (document.querySelector('dialog[open]')) lenis.stop();
    else lenis.start();
  }

  function syncMotionPreference() {
    if (reducedMotion.matches) {
      if (ticker) window.gsap.ticker.remove(ticker);
      ticker = null;
      lenis?.destroy();
      lenis = null;
      return;
    }
    if (!lenis) {
      lenis = new window.Lenis({
        autoRaf: !window.gsap,
        lerp: 0.1,
        smoothWheel: true,
        syncTouch: false,
        anchors: true,
        stopInertiaOnNavigate: true,
      });
      if (window.gsap) {
        ticker = time => lenis?.raf(time * 1000);
        window.gsap.ticker.add(ticker);
        window.gsap.ticker.lagSmoothing(0);
      }
      if (window.ScrollTrigger) lenis.on('scroll', window.ScrollTrigger.update);
      syncDialogs();
    }
  }

  const dialogObserver = new MutationObserver(syncDialogs);
  dialogs.forEach(dialog => dialogObserver.observe(dialog, {
    attributes: true,
    attributeFilter: ['open'],
  }));
  reducedMotion.addEventListener('change', syncMotionPreference);
  syncMotionPreference();
})();
