/* =========================================================
   reveal.js (case study pages)
   1. Scroll reveal: [data-reveal] and [data-reveal-group] get .is-in
      each time they enter the screen, and lose it once fully off
      screen, so every reveal replays (down and back up). The hero's
      load animation replays the same way.
   2. Videos: play on screen, pause off screen
   Loaded in <head> WITHOUT defer, so the .js class is on <html>
   before anything is drawn (no flash of content that then hides).
   Everything else waits for the DOM.
   ========================================================= */

'use strict';

// 1st thing: hidden start states in case.css only apply under .js
document.documentElement.classList.add('js');

(function () {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasObserver = 'IntersectionObserver' in window;


  /* ---------- 1. Scroll reveal ----------
     Group children get .reveal-item and --i (0, 1, 2…); CSS turns --i
     into the stagger delay. data-reveal-group="selector" picks which
     elements are the items (default: the direct children). */
  function initReveal() {
    const groups = document.querySelectorAll('[data-reveal-group]');
    groups.forEach((group) => {
      const selector = group.dataset.revealGroup;
      const items = selector ? group.querySelectorAll(selector) : group.children;
      Array.from(items).forEach((item, i) => {
        item.classList.add('reveal-item');
        item.style.setProperty('--i', i);
      });
    });

    const targets = document.querySelectorAll('[data-reveal], [data-reveal-group]');
    if (!hasObserver) {
      targets.forEach((el) => el.classList.add('is-in'));
      return;
    }

    // Enter: same trigger as before (15% in, above the bottom 10%)
    const enter = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        if (el.classList.contains('is-in')) return;
        if (el.hasAttribute('data-reveal-visible-only')) staggerVisibleOnly(el);
        el.classList.add('is-in');
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -10% 0px' });

    // Leave: only once fully off screen, plus 32px. The hidden state
    // moves an element 24px down; without the margin, one just above
    // the screen would slide back into view, reveal, leave, and loop.
    // So the reset is never seen and never flickers at the edge.
    const leave = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) return;
        entry.target.classList.remove('is-in');
      });
    }, { threshold: 0, rootMargin: '32px 0px' });

    targets.forEach((el) => {
      enter.observe(el);
      leave.observe(el);
    });
  }

  /* Hero: its load animation (.load-up, CSS) replays when the hero
     comes back on screen. While it's fully off screen it gets
     .is-out, which stops the animation and hides the blocks; taking
     it off restarts the animation from the start. */
  function initHeroReplay() {
    const hero = document.querySelector('.case-hero');
    if (!hero || !hasObserver) return;
    const observer = new IntersectionObserver(([entry]) => {
      hero.classList.toggle('is-out', !entry.isIntersecting);
    }, { threshold: 0 });
    observer.observe(hero);
  }

  /* Screens strip: only the figures you can see stagger in.
     The ones off to the right (inside the scroll area) are simply
     there when you scroll to them. */
  function staggerVisibleOnly(group) {
    const box = group.getBoundingClientRect();
    let i = 0;
    group.querySelectorAll('.reveal-item').forEach((item) => {
      item.style.transition = '';   // reset from the last time
      const rect = item.getBoundingClientRect();
      if (rect.left < box.right && rect.right > box.left) {
        item.style.setProperty('--i', i++);
      } else {
        item.style.transition = 'none';
      }
    });
  }


  /* ---------- 2. Videos ----------
     [data-play-in-view] videos play when 25% on screen and pause when
     they leave. If the user paused one with its controls, it isn't
     resumed until they press play again.
     Reduced motion: nothing autoplays; the poster shows and the user
     can press play (the cover video gets controls for that). */
  function initVideos() {
    const videos = document.querySelectorAll('video[data-play-in-view]');
    if (!videos.length) return;

    videos.forEach((video) => {
      // Tell our own pause() apart from the user's
      video.addEventListener('pause', () => {
        if (video.dataset.autoPause) {
          delete video.dataset.autoPause;
        } else {
          video.dataset.userPaused = 'true';
        }
      });
      video.addEventListener('play', () => {
        delete video.dataset.userPaused;
      });

      if (reducedMotion && video.autoplay) {
        video.autoplay = false;
        video.controls = true;
        video.pause();
        video.load(); // back to the poster frame
      }
    });

    function play(video) {
      if (reducedMotion || video.dataset.userPaused) return;
      const promise = video.play();
      // A blocked autoplay rejects the promise; never let it throw
      if (promise) promise.catch(() => {});
    }

    function pause(video) {
      if (video.paused) return;
      video.dataset.autoPause = 'true';
      video.pause();
    }

    if (!hasObserver) {
      videos.forEach(play);
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) play(entry.target);
        else pause(entry.target);
      });
    }, { threshold: 0.25 });

    videos.forEach((video) => observer.observe(video));
  }


  /* ---------- Start ---------- */
  function start() {
    initReveal();
    initHeroReplay();
    initVideos();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
