async function loadInclude(selector, url) {
  const target = document.querySelector(selector);
  if (!target) return;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
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
      menuButton.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      menuButton.textContent = open ? '×' : '☰';
    });

    mobileNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', closeMobileNav);
    });

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && mobileNav.classList.contains('open')) {
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
      backToTop.classList.toggle('visible', window.scrollY > 300);
    }
  }

  if (backToTop) {
    backToTop.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
          ? 'auto'
          : 'smooth'
      });
    });
  }

  const homeLogos = [
    document.getElementById('miniLogoHome'),
    document.getElementById('mainLogoHome')
  ].filter(Boolean);

  homeLogos.forEach(logo => {
    logo.addEventListener('click', event => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
      }

      event.preventDefault();

      const destination = logo.href;

      logo.classList.remove('logo-jump');
      void logo.offsetWidth;
      logo.classList.add('logo-jump');

      window.setTimeout(() => {
        window.location.href = destination;
      }, 230);
    });
  });

  updateScrollUI();

  window.addEventListener('scroll', updateScrollUI, {
    passive: true
  });

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
