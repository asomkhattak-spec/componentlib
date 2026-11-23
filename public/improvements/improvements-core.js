/**
 * ============================================
 * UNIVERSAL IMPROVEMENT JS — Core Engine
 * Handles: Theme, Scroll Reveal, Error Handling,
 *          Scroll-to-Top, Ripple Effects, Security
 * ============================================
 */
(function() {
  'use strict';

  /* ========== THEME MANAGER ========== */
  const ThemeManager = {
    init() {
      this.current = localStorage.getItem('site-theme') || this.getSystemTheme();
      this.apply(this.current);
      this.createToggle();
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('site-theme')) this.apply(e.matches ? 'dark' : 'light');
      });
    },
    getSystemTheme() {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    },
    apply(theme) {
      document.documentElement.setAttribute('data-theme', theme);
      document.documentElement.classList.toggle('dark', theme === 'dark');
      this.current = theme;
      localStorage.setItem('site-theme', theme);
      const btn = document.querySelector('.theme-toggle');
      if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';
    },
    toggle() {
      this.apply(this.current === 'dark' ? 'light' : 'dark');
    },
    createToggle() {
      if (document.querySelector('.theme-toggle')) return;
      const btn = document.createElement('button');
      btn.className = 'theme-toggle';
      btn.setAttribute('aria-label', 'Toggle dark mode');
      btn.setAttribute('title', 'Toggle dark/light mode');
      btn.textContent = this.current === 'dark' ? '☀️' : '🌙';
      btn.addEventListener('click', () => this.toggle());
      document.body.appendChild(btn);
    }
  };

  /* ========== SCROLL REVEAL ========== */
  const ScrollReveal = {
    init() {
      const elements = document.querySelectorAll(
        'section, article, .card, [class*="card"], [class*="feature"], ' +
        '[class*="service"], [class*="project"], [class*="item"], ' +
        'h1, h2, h3, .hero, [class*="hero"], [class*="about"], ' +
        '[class*="contact"], [class*="gallery"], footer, ' +
        '[class*="grid"] > *, [class*="list"] > *, [class*="container"] > div'
      );

      elements.forEach((el, i) => {
        if (!el.classList.contains('reveal') &&
            !el.classList.contains('theme-toggle') &&
            !el.classList.contains('scroll-top-btn') &&
            el.offsetHeight > 20) {
          el.classList.add('reveal');
          const delay = Math.min(i % 5, 4);
          if (delay > 0) el.classList.add('reveal-delay-' + delay);
        }
      });

      if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.classList.add('revealed');
              observer.unobserve(entry.target);
            }
          });
        }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

        document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale')
          .forEach(el => observer.observe(el));
      } else {
        document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale')
          .forEach(el => el.classList.add('revealed'));
      }
    }
  };

  /* ========== SCROLL TO TOP ========== */
  const ScrollTop = {
    init() {
      if (document.querySelector('.scroll-top-btn')) return;
      const btn = document.createElement('button');
      btn.className = 'scroll-top-btn';
      btn.setAttribute('aria-label', 'Scroll to top');
      btn.innerHTML = '↑';
      btn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
      document.body.appendChild(btn);

      window.addEventListener('scroll', () => {
        btn.classList.toggle('visible', window.scrollY > 300);
      }, { passive: true });
    }
  };

  /* ========== RIPPLE EFFECT ========== */
  const RippleEffect = {
    init() {
      document.querySelectorAll('button, a[class*="btn"], [class*="button"], [role="button"]')
        .forEach(el => {
          if (el.classList.contains('theme-toggle') || el.classList.contains('scroll-top-btn')) return;
          el.classList.add('btn-ripple');
          el.addEventListener('click', function(e) {
            const rect = this.getBoundingClientRect();
            const ripple = document.createElement('span');
            ripple.className = 'ripple';
            const size = Math.max(rect.width, rect.height);
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
            ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
            this.appendChild(ripple);
            setTimeout(() => ripple.remove(), 600);
          });
        });
    }
  };

  /* ========== LAZY LOADING ========== */
  const LazyLoader = {
    init() {
      document.querySelectorAll('img:not([loading])').forEach(img => {
        img.setAttribute('loading', 'lazy');
        img.setAttribute('decoding', 'async');
      });
      document.querySelectorAll('iframe:not([loading])').forEach(iframe => {
        iframe.setAttribute('loading', 'lazy');
      });
    }
  };

  /* ========== ERROR HANDLING ========== */
  const ErrorHandler = {
    init() {
      window.addEventListener('error', (event) => {
        console.error('[Site Error]', event.message, 'at', event.filename, ':', event.lineno);
        this.showToast('Something went wrong. Please try refreshing.');
        this.report({ type: 'uncaught', message: event.message, file: event.filename, line: event.lineno });
      });

      window.addEventListener('unhandledrejection', (event) => {
        console.error('[Unhandled Promise]', event.reason);
        this.report({ type: 'promise', message: String(event.reason) });
      });
    },
    showToast(msg) {
      if (document.querySelector('.error-toast')) return;
      const toast = document.createElement('div');
      toast.className = 'error-toast';
      toast.style.cssText = `
        position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%) translateY(20px);
        background: var(--color-error, #ef4444); color: white; padding: 12px 24px;
        border-radius: 8px; font-size: 14px; z-index: 999999; opacity: 0;
        transition: all 0.3s ease; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        font-family: var(--font-sans, sans-serif); max-width: 90vw;
      `;
      toast.textContent = msg;
      document.body.appendChild(toast);
      requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(-50%) translateY(0)';
      });
      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(20px)';
        setTimeout(() => toast.remove(), 300);
      }, 5000);
    },
    report(data) {
      try {
        const payload = {
          ...data,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          userAgent: navigator.userAgent,
        };
        if (navigator.sendBeacon) {
          navigator.sendBeacon('/api/errors', JSON.stringify(payload));
        }
      } catch(e) { /* silent */ }
    }
  };

  /* ========== SECURITY ENHANCEMENTS ========== */
  const SecurityEnhancer = {
    init() {
      // Prevent clickjacking (fallback if no X-Frame-Options header)
      if (window.self !== window.top) {
        document.body.style.display = 'none';
        window.top.location = window.self.location;
      }

      // Sanitize URL params from XSS
      const params = new URLSearchParams(window.location.search);
      for (const [key, value] of params) {
        if (/<script|javascript:|on\w+=/i.test(value)) {
          console.warn('[Security] Suspicious URL parameter detected:', key);
          const clean = new URL(window.location.href);
          clean.searchParams.delete(key);
          window.history.replaceState({}, '', clean.href);
        }
      }

      // Disable right-click on sensitive elements (optional, non-invasive)
      document.querySelectorAll('[data-protected]').forEach(el => {
        el.addEventListener('contextmenu', e => e.preventDefault());
      });
    }
  };

  /* ========== PERFORMANCE MONITOR ========== */
  const PerfMonitor = {
    init() {
      if ('PerformanceObserver' in window) {
        try {
          // Monitor Largest Contentful Paint
          const lcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lcp = entries[entries.length - 1];
            console.info('[Perf] LCP:', Math.round(lcp.startTime) + 'ms');
          });
          lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

          // Monitor Cumulative Layout Shift
          let clsScore = 0;
          const clsObserver = new PerformanceObserver((list) => {
            list.getEntries().forEach(entry => {
              if (!entry.hadRecentInput) clsScore += entry.value;
            });
          });
          clsObserver.observe({ type: 'layout-shift', buffered: true });

          // Log on page unload
          window.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
              console.info('[Perf] Total CLS:', clsScore.toFixed(4));
            }
          });
        } catch(e) { /* browser doesn't support, ignore */ }
      }
    }
  };

  /* ========== PAGE ENTRANCE ANIMATION ========== */
  const PageEntrance = {
    init() {
      document.body.classList.add('page-enter');
    }
  };

  /* ========== SMOOTH ANCHOR SCROLLING ========== */
  const SmoothAnchors = {
    init() {
      document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
          const target = document.querySelector(this.getAttribute('href'));
          if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        });
      });
    }
  };

  /* ========== INITIALIZE ALL ========== */
  function initAll() {
    ThemeManager.init();
    ErrorHandler.init();
    SecurityEnhancer.init();
    LazyLoader.init();
    PageEntrance.init();
    SmoothAnchors.init();
    PerfMonitor.init();

    // Delayed init for DOM-dependent features
    requestAnimationFrame(() => {
      ScrollReveal.init();
      ScrollTop.init();
      RippleEffect.init();
    });
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }

  // Export for programmatic use
  window.__improvements = { ThemeManager, ScrollReveal, ScrollTop, ErrorHandler };
})();
