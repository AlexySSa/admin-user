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
      if (index < activeIndex) dot.classList.add('is-complete');
      if (index === activeIndex) dot.classList.add('is-active');
    });
  };

  const showSlide = (index) => {
    current = (index + slides.length) % slides.length;
    slides.forEach((slide, i) => slide.classList.toggle('is-active', i === current));
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

  if (hero) {
    hero.addEventListener('mouseenter', () => clearInterval(autoTimer));
    hero.addEventListener('mouseleave', startAuto);
    hero.addEventListener('touchstart', () => clearInterval(autoTimer), { passive: true });
    hero.addEventListener('touchend', startAuto, { passive: true });
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