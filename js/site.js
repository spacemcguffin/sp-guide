async function loadInclude(selector, url) {
  const target = document.querySelector(selector);
  if (!target) return;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }

    target.innerHTML = await response.text();
  } catch (error) {
    console.error(`Could not load ${url}:`, error);
  }
}

function initSharedSite() {
  const menuButton = document.getElementById('menuButton');
  const mobileNav = document.getElementById('mobileNav');
  const scrollHeader = document.getElementById('scrollHeader');
  const backToTop = document.getElementById('back-to-top');

  function closeMobileNav() {
    if (!menuButton || !mobileNav) return;

    mobileNav.classList.remove('open');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Open menu');
    menuButton.textContent = '☰';
  }

  if (menuButton && mobileNav) {
    menuButton.addEventListener('click', () => {
      const open = !mobileNav.classList.contains('open');

      mobileNav.classList.toggle('open', open);
      menuButton.setAttribute('aria-expanded', String(open));
      menuButton.setAttribute(
        'aria-label',
        open ? 'Close menu' : 'Open menu'
      );
      menuButton.textContent = open ? '×' : '☰';
    });

    mobileNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', closeMobileNav);
    });

    document.addEventListener('keydown', event => {
      if (
        event.key === 'Escape' &&
        mobileNav.classList.contains('open')
      ) {
        closeMobileNav();
        menuButton.focus();
      }
    });
  }

  function updateScrollUI() {
    if (scrollHeader) {
      const threshold = window.innerWidth <= 760 ? 6 : 120;
      const visible = window.scrollY > threshold;

      scrollHeader.classList.toggle('is-visible', visible);

      if (!visible) {
        closeMobileNav();
      }
    }

    if (backToTop) {
      backToTop.classList.toggle(
        'visible',
        window.scrollY > 300
      );
    }
  }

  if (backToTop) {
    backToTop.addEventListener('click', () => {
      const reducedMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      ).matches;

      window.scrollTo({
        top: 0,
        behavior: reducedMotion ? 'auto' : 'smooth'
      });
    });
  }

  const homeLogos = [
    document.getElementById('miniLogoHome'),
    document.getElementById('mainLogoHome')
  ].filter(Boolean);

  const isHomepage =
    window.location.pathname === '/' ||
    window.location.pathname === '/index.html';

  homeLogos.forEach(logo => {
    logo.addEventListener('click', event => {
      event.preventDefault();

      const reducedMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      ).matches;

      if (isHomepage) {
        if (!reducedMotion) {
          logo.classList.remove('logo-jump');
          void logo.offsetWidth;
          logo.classList.add('logo-jump');

          window.setTimeout(() => {
            logo.classList.remove('logo-jump');
          }, 420);
        }

        window.scrollTo({
          top: 0,
          behavior: reducedMotion ? 'auto' : 'smooth'
        });

        return;
      }

      if (reducedMotion) {
        window.location.href = '/';
        return;
      }

      logo.classList.remove('logo-jump');
      void logo.offsetWidth;
      logo.classList.add('logo-jump');

      window.setTimeout(() => {
        window.location.href = '/';
      }, 230);
    });
  });

  updateScrollUI();

  window.addEventListener(
    'scroll',
    updateScrollUI,
    { passive: true }
  );

  window.addEventListener('resize', () => {
    updateScrollUI();

    if (window.innerWidth > 760) {
      closeMobileNav();
    }
  });
}

async function initSiteShell() {
  await Promise.all([
    loadInclude('#site-header', '/includes/header.html'),
    loadInclude('#site-footer', '/includes/footer.html')
  ]);

  initSharedSite();

  document.dispatchEvent(
    new CustomEvent('site-shell-ready')
  );
}

initSiteShell();








/* Article gallery + lightbox */
function initArticleGalleries() {
  const galleries = document.querySelectorAll('.article-gallery');

  if (!galleries.length) return;

  galleries.forEach(gallery => {
    const images = [...gallery.querySelectorAll('img')];

    if (!images.length) return;

    /* Turn gallery images into clickable items */
    images.forEach((img, index) => {
      img.setAttribute('tabindex', '0');
      img.setAttribute('role', 'button');
      img.setAttribute(
        'aria-label',
        img.alt
          ? `Open image: ${img.alt}`
          : `Open image ${index + 1}`
      );
    });

    /* Build lightbox automatically */
    const lightbox = document.createElement('div');
    lightbox.className = 'article-lightbox';
    lightbox.setAttribute('aria-hidden', 'true');
    lightbox.setAttribute('role', 'dialog');
    lightbox.setAttribute('aria-modal', 'true');
    lightbox.setAttribute('aria-label', 'Image gallery');

    lightbox.innerHTML = `
      <button
        class="article-lightbox-close"
        type="button"
        aria-label="Close gallery"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 5L19 19M19 5L5 19"/>
        </svg>
      </button>

      <button
        class="article-lightbox-nav article-lightbox-prev"
        type="button"
        aria-label="Previous image"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M15 5L8 12L15 19"/>
        </svg>
      </button>

      <div class="article-lightbox-stage">
        <img class="article-lightbox-image" src="" alt="">
        <div
          class="article-lightbox-count"
          aria-live="polite"
        ></div>
      </div>

      <button
        class="article-lightbox-nav article-lightbox-next"
        type="button"
        aria-label="Next image"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M9 5L16 12L9 19"/>
        </svg>
      </button>
    `;

    document.body.appendChild(lightbox);

    const lightboxImage =
      lightbox.querySelector('.article-lightbox-image');

    const count =
      lightbox.querySelector('.article-lightbox-count');

    const closeButton =
      lightbox.querySelector('.article-lightbox-close');

    const previousButton =
      lightbox.querySelector('.article-lightbox-prev');

    const nextButton =
      lightbox.querySelector('.article-lightbox-next');

    let currentIndex = 0;
    let touchStartX = 0;

    function showImage(index) {
      currentIndex =
        (index + images.length) % images.length;

      const source = images[currentIndex];

      lightboxImage.src = source.currentSrc || source.src;
      lightboxImage.alt = source.alt || '';

      count.textContent =
        `${currentIndex + 1} / ${images.length}`;
    }

    function openLightbox(index) {
      showImage(index);

      lightbox.classList.add('is-open');
      lightbox.setAttribute('aria-hidden', 'false');

      document.body.classList.add('gallery-open');

      closeButton.focus();
    }

    function closeLightbox() {
      lightbox.classList.remove('is-open');
      lightbox.setAttribute('aria-hidden', 'true');

      document.body.classList.remove('gallery-open');

      images[currentIndex].focus();
    }

    function previousImage() {
      showImage(currentIndex - 1);
    }

    function nextImage() {
      showImage(currentIndex + 1);
    }

    images.forEach((img, index) => {
      img.addEventListener('click', () => {
        openLightbox(index);
      });

      img.addEventListener('keydown', event => {
        if (
          event.key === 'Enter' ||
          event.key === ' '
        ) {
          event.preventDefault();
          openLightbox(index);
        }
      });
    });

    closeButton.addEventListener(
      'click',
      closeLightbox
    );

    previousButton.addEventListener(
      'click',
      previousImage
    );

    nextButton.addEventListener(
      'click',
      nextImage
    );

    /* Click dark background to close */
    lightbox.addEventListener('click', event => {
      if (
        event.target === lightbox ||
        event.target.classList.contains(
          'article-lightbox-stage'
        )
      ) {
        closeLightbox();
      }
    });

    /* Keyboard controls */
    document.addEventListener('keydown', event => {
      if (!lightbox.classList.contains('is-open')) {
        return;
      }

      if (event.key === 'Escape') {
        closeLightbox();
      }

      if (event.key === 'ArrowLeft') {
        previousImage();
      }

      if (event.key === 'ArrowRight') {
        nextImage();
      }
    });

    /* Mobile swipe */
    lightbox.addEventListener(
      'touchstart',
      event => {
        touchStartX =
          event.changedTouches[0].clientX;
      },
      { passive: true }
    );

    lightbox.addEventListener(
      'touchend',
      event => {
        const touchEndX =
          event.changedTouches[0].clientX;

        const distance =
          touchEndX - touchStartX;

        if (Math.abs(distance) < 45) return;

        if (distance > 0) {
          previousImage();
        } else {
          nextImage();
        }
      },
      { passive: true }
    );
  });
}

initArticleGalleries();



















/* GoatCounter analytics */
(function () {
  if (document.querySelector('script[data-goatcounter]')) return;

  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://gc.zgo.at/count.js';
  script.dataset.goatcounter =
    'https://spacemcguffin.goatcounter.com/count';

  document.head.appendChild(script);
})();
