(() => {
  const shareButton = document.querySelector('#shareButton');
  const toast = document.querySelector('#toast');
  const hero = document.querySelector('.hero');
  const slides = [...document.querySelectorAll('.hero__slide')];
  const dots = [...document.querySelectorAll('.hero__dot')];
  const kicker = document.querySelector('#heroKicker');
  const counter = document.querySelector('#heroCounter');
  const note = document.querySelector('#heroNote');
  const locationLabel = document.querySelector('#heroLocation');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const slideDuration = 4800;
  let toastTimeout;
  let current = 0;
  let autoTimer;

  const notify = (message) => {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => toast.classList.remove('is-visible'), 3000);
  };

  const loadFullImage = (slide) => {
    if (!slide) return;
    const img = slide.querySelector('.hero__img');
    if (!img || img.dataset.loaded === 'true') return;
    const fullSrc = img.dataset.full;
    if (!fullSrc) return;
    const preloader = new Image();
    preloader.src = fullSrc;
    preloader.onload = () => {
      img.src = fullSrc;
      img.dataset.loaded = 'true';
      img.classList.remove('is-preview');
    };
  };

  const preloadAround = (index) => {
    [index, (index + 1) % slides.length, (index + 2) % slides.length].forEach((i) => loadFullImage(slides[i]));
  };

  const resetBars = (activeIndex) => {
    dots.forEach((dot, index) => {
      dot.classList.remove('is-active', 'is-complete');
      const bar = dot.querySelector('span');
      if (bar) {
        bar.style.animation = 'none';
        void bar.offsetWidth;
        bar.style.animation = '';
      }
      dot.setAttribute('aria-current', index === activeIndex ? 'true' : 'false');
      if (index < activeIndex) dot.classList.add('is-complete');
      if (index === activeIndex) dot.classList.add('is-active');
    });
  };

  let exitCleanup;
  const showSlide = (index) => {
    const next = (index + slides.length) % slides.length;
    if (next !== current) {
      const direction = index > current ? 1 : -1;
      hero?.style.setProperty('--slide-direction', direction);
      const outgoing = slides[current];
      const incoming = slides[next];
      clearTimeout(exitCleanup);
      // Clear any stale transitions from a quick series of swipes.
      slides.forEach((slide, i) => {
        if (i !== current && i !== next) slide.classList.remove('is-active', 'is-exiting');
      });
      // Establish the off-screen state before smoothly revealing the new photo.
      incoming.classList.remove('is-active', 'is-exiting');
      void incoming.offsetWidth;
      outgoing.classList.remove('is-active');
      outgoing.classList.add('is-exiting');
      incoming.classList.add('is-active');
      exitCleanup = setTimeout(() => {
        if (!outgoing.classList.contains('is-active')) outgoing.classList.remove('is-exiting');
      }, 1050);
    }
    current = next;
    const active = slides[current];
    kicker.textContent = active.dataset.kicker || '';
    counter.textContent = `${current + 1} / ${slides.length}`;
    note.textContent = active.dataset.note || '';
    locationLabel.textContent = active.dataset.location || '';
    loadFullImage(active);
    preloadAround(current);
    resetBars(current);
  };

  const startAuto = () => {
    if (reducedMotion || slides.length < 2) return;
    clearInterval(autoTimer);
    autoTimer = setInterval(() => showSlide(current + 1), slideDuration);
  };

  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
      showSlide(index);
      startAuto();
    });
  });

  // Navegación táctil y con mouse: deslizar o tocar la mitad izquierda/derecha.
  // Los controles de progreso conservan su propio evento de clic.
  if (hero) {
    let gesture = null;
    hero.addEventListener('pointerdown', (event) => {
      if (!event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0) ||
          event.target.closest('.hero__progress')) return;
      gesture = {
        id: event.pointerId, x: event.clientX, y: event.clientY,
        time: performance.now()
      };
      clearInterval(autoTimer);
    });

    hero.addEventListener('pointerup', (event) => {
      if (!gesture || event.pointerId !== gesture.id) return;
      const dx = event.clientX - gesture.x;
      const dy = event.clientY - gesture.y;
      const duration = performance.now() - gesture.time;
      gesture = null;

      if (Math.abs(dx) >= 35 && Math.abs(dx) > Math.abs(dy) * 1.2) {
        // Izquierda -> siguiente, derecha -> anterior.
        showSlide(current + (dx < 0 ? 1 : -1));
      } else if (Math.abs(dx) < 12 && Math.abs(dy) < 12 && duration < 700 &&
                 !event.target.closest('.hero__progress')) {
        const bounds = hero.getBoundingClientRect();
        // Tocar la mitad izquierda retrocede; tocar la derecha avanza.
        showSlide(current + (event.clientX < bounds.left + bounds.width / 2 ? -1 : 1));
      }
      startAuto();
    });

    hero.addEventListener('pointercancel', () => {
      gesture = null;
      startAuto();
    });

    hero.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      showSlide(current + (event.key === 'ArrowLeft' ? -1 : 1));
      startAuto();
    });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) clearInterval(autoTimer);
      else startAuto();
    });
  }

  shareButton?.addEventListener('click', async () => {
    const url = window.location.href.split('#')[0];
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Alexy Sánchez — Links', text: 'Mis redes en un solo lugar.', url });
        return;
      } catch (error) {
        if (error.name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      notify('Enlace copiado al portapapeles.');
    } catch {
      notify('Copia el enlace desde la barra del navegador.');
    }
  });

  showSlide(0);
  startAuto();

  if (!reducedMotion && window.matchMedia('(pointer: fine)').matches && hero) {
    let frameId = 0;
    hero.addEventListener('pointermove', (event) => {
      if (frameId) return;
      frameId = requestAnimationFrame(() => {
        const rect = hero.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - .5;
        const y = (event.clientY - rect.top) / rect.height - .5;
        hero.style.setProperty('--tilt-x', `${(-y * 2.5).toFixed(2)}deg`);
        hero.style.setProperty('--tilt-y', `${(x * 2.5).toFixed(2)}deg`);
        frameId = 0;
      });
    });
    hero.addEventListener('pointerleave', () => {
      if (frameId) cancelAnimationFrame(frameId);
      frameId = 0;
      hero.style.removeProperty('--tilt-x');
      hero.style.removeProperty('--tilt-y');
    });
  }
})();