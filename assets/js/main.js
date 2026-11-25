/* =========================================================
   main.js
   1. Cover column: infinite, auto-advancing project column
   2. Side menu: pins on desktop, adapts its colour,
      highlights the section in view
   3. Work section: hide a row's peek image if it doesn't fit
   4. Work section: "Selected Art Direction Work" dropdown
   5. WaitWell hero video: height limit below the header
   6. Screens strip arrow buttons (WaitWell)
   7. CV: "View my CV" row + CV sheet (homepage)
   ========================================================= */

'use strict';

/* ---------- Project data (edit projects here) ---------- */
const PROJECTS = [
  {
    name: 'WaitWell',
    role: 'UX/UI Design\nUX Research',
    href: 'work/waitwell.html',
    image: 'assets/img/covers/waitwell-cover.jpg',
    alt: 'WaitWell splash screen: real-time A&E wait updates for NHS patients'
  },
  {
    name: 'DreamLab',
    role: 'UX/UI Design\nFrontend Development\nBackend Development',
    href: 'work/dreamlab.html',
    // A project with `video` gets a looping video cover instead of an image
    video: 'assets/video/dreamlab/dreamlab-cover.mp4',
    poster: 'assets/video/dreamlab/dreamlab-cover-poster.jpg',
    alt: 'DreamLab landing page and patient dashboard'
  }
];

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');


/* =========================================================
   1. Cover column
   ========================================================= */
function initCoverColumn() {
  const stage = document.querySelector('.cover-stage');
  const column = document.querySelector('.cover-column');
  const track = document.querySelector('.cover-track');
  const nameLabel = document.querySelector('.cover-name');
  const roleLabel = document.querySelector('.cover-role');
  if (!column || !track) return;

  // Tile positions are read from the real layout, see tileTop()
  const COUNT = PROJECTS.length;     // 2 projects
  const COPIES = 3;                  // the list is repeated 3 times (6 tiles)
  const START = COUNT;               // index 2 = first tile of the middle copy
  const AUTO_DELAY = 3200;           // auto-advance interval
  const USER_PAUSE = 4000;           // pause after the user scrolls
  const SCROLL_END_DELAY = 180;      // "scrolling has stopped" debounce
  const TRANSITION_MS = 650;         // tile fade/scale time in layout.css (.6s) + a margin

  /* --- Build the tiles: 3 copies of the project list ---
     Only the middle copy is focusable and read by screen readers;
     the other two copies exist only to make the loop seamless. */
  const tiles = [];
  const videos = [];   // video covers (one per copy), tiles[i] ↔ videos[i] or undefined
  for (let copy = 0; copy < COPIES; copy++) {
    PROJECTS.forEach((project) => {
      const link = document.createElement('a');
      link.className = 'cover-tile';
      link.href = project.href;
      link.setAttribute('aria-label', project.name + ' case study');
      if (copy !== 1) {
        link.setAttribute('aria-hidden', 'true');
        link.tabIndex = -1;
      }

      let media;
      if (project.video) {
        // Video cover: muted and looping. It is started by playVideos()
        // below (not by the autoplay attribute), so it never plays
        // off screen or when the user prefers reduced motion; then the
        // poster image shows instead.
        media = document.createElement('video');
        media.muted = true;
        media.loop = true;
        media.playsInline = true;
        media.setAttribute('muted', '');
        media.setAttribute('playsinline', '');
        media.preload = 'metadata';
        media.poster = project.poster;
        media.src = project.video;
        media.setAttribute('aria-label', project.alt);
      } else {
        media = document.createElement('img');
        media.src = project.image;
        media.alt = project.alt;
      }
      media.width = 300;
      media.height = 375;

      link.appendChild(media);
      track.appendChild(link);
      tiles.push(link);
      videos.push(project.video ? media : undefined);
    });
  }

  /* --- State --- */
  let activeIndex = -1;     // tile currently in the centre
  let activeProject = 0;    // 0..1, the labels already show project 0 in the HTML
  let targetIndex = null;   // where a smooth scroll is heading (for fast key presses)
  let isHovering = false;
  let hasFocus = false;
  let isTouching = false;
  let isOnScreen = true;
  let pausedUntil = 0;
  let scrollEndTimer = null;
  let lastActiveChange = 0; // when the centre tile last changed (performance.now())

  /* Play the video covers only while the hero is on screen and motion
     is allowed; otherwise pause them (reduced motion: back to the poster). */
  function updateVideos() {
    const shouldPlay = isOnScreen && !document.hidden && !reducedMotion.matches;
    videos.forEach((video) => {
      if (!video) return;
      if (shouldPlay) {
        const promise = video.play();
        if (promise) promise.catch(() => {}); // autoplay blocked: poster stays
      } else if (!video.paused) {
        video.pause();
        if (reducedMotion.matches) video.load(); // show the poster again
      }
    });
  }
  document.addEventListener('visibilitychange', updateVideos);
  reducedMotion.addEventListener('change', updateVideos);

  /* --- Geometry: always read from the real layout ---
     tileTop(i) is the scrollTop that puts tile i exactly in the centre
     of the column. It is the same point the browser snaps to
     (scroll-snap-align: center), so scrolling there and then switching
     snapping back on never causes a correction.
     All tiles have the same layout size; the active / inactive
     difference is only a transform on the image inside, which doesn't
     move anything. */
  function tileTop(index) {
    const tile = tiles[index];
    return tile.offsetTop + tile.offsetHeight / 2 - column.clientHeight / 2;
  }

  // Distance from one tile to the next
  function pitch() {
    return tiles[1].offsetTop - tiles[0].offsetTop;
  }

  // The tile closest to the centre right now
  function nearestIndex() {
    const index = Math.round((column.scrollTop - tileTop(0)) / pitch());
    return Math.max(0, Math.min(tiles.length - 1, index));
  }

  /* Snapping is switched off while the script scrolls (a smooth scroll
     and mandatory snapping fight each other: overshoot, then snap back)
     and switched on again when the scroll has ended. */
  function setSnap(on) {
    column.style.scrollSnapType = on ? '' : 'none';
  }

  // If the tile size changed (resize, headline alignment), put the
  // current tile back in the centre without animation.
  let layoutKey = '';
  function recentre() {
    const key = pitch() + '/' + column.clientHeight;
    if (key === layoutKey) return;
    layoutKey = key;
    if (activeIndex >= 0) column.scrollTo({ top: tileTop(activeIndex), behavior: 'auto' });
  }

  /* --- Two-column hero (1100px and wider): match the headline ---
     The active tile is exactly as tall as the headline's text: from the
     top of the capitals in the first line to the baseline of the last
     line. Its vertical centre sits on the headline's centre.
     The sizes go to CSS as variables on .covers (see layout.css); the
     crop frame, labels, padding and column height all follow from them.
     Below 1100px the variables are removed and the CSS sizes apply. */
  const title = document.querySelector('.hero-title');
  const covers = document.querySelector('.covers');
  const twoColumns = window.matchMedia('(min-width: 1100px)');
  const GAP_RATIO = 0.04;            // gap between tiles = 4% of the tile height
  const PAD_RATIO = 0.32;            // space above/below the active tile (gap + peek)

  // Zero-size marks at the start and end of the headline; each one
  // sits on the baseline of its line (styled in layout.css).
  let firstMark = null;
  let lastMark = null;
  if (title && covers) {
    firstMark = document.createElement('span');
    lastMark = document.createElement('span');
    [firstMark, lastMark].forEach((mark) => {
      mark.className = 'baseline-probe';
      mark.setAttribute('aria-hidden', 'true');
    });
    title.prepend(firstMark);
    title.append(lastMark);
  }

  // Height of a capital letter in the headline's font, in px.
  // Measured on a canvas; if that isn't possible, 0.7em is close.
  const capCanvas = document.createElement('canvas').getContext('2d');
  function capHeight() {
    const style = getComputedStyle(title);
    if (capCanvas) {
      capCanvas.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      const ascent = capCanvas.measureText('H').actualBoundingBoxAscent;
      if (ascent > 0) return ascent;
    }
    return parseFloat(style.fontSize) * 0.7;
  }

  function alignToHeadline() {
    if (!firstMark) return;

    if (!twoColumns.matches) {
      ['--cover-h', '--cover-gap', '--cover-pad', '--cover-shift'].forEach((name) => covers.style.removeProperty(name));
      recentre();
      return;
    }

    // 1. Size: first line's cap top → last line's baseline
    const capTop = firstMark.getBoundingClientRect().bottom - capHeight();
    const baseline = lastMark.getBoundingClientRect().bottom;
    const height = Math.round(baseline - capTop);
    if (height <= 0) return;
    covers.style.setProperty('--cover-h', height + 'px');
    // Whole pixels, so every tile position is a whole pixel too
    covers.style.setProperty('--cover-gap', Math.round(height * GAP_RATIO) + 'px');
    covers.style.setProperty('--cover-pad', Math.round(height * PAD_RATIO) + 'px');

    // 2. Position: move the column by the distance between the two centres.
    // The headline slides up 24px while it fades in on page load; take
    // that out, so we align with where it ends up.
    const slide = new DOMMatrixReadOnly(getComputedStyle(title).transform).m42;
    const headlineCentre = (capTop + baseline) / 2 - slide;
    const stageBox = stage.getBoundingClientRect();
    const tileCentre = stageBox.top + stageBox.height / 2;
    const shift = parseFloat(getComputedStyle(covers).marginTop) + headlineCentre - tileCentre;
    covers.style.setProperty('--cover-shift', shift + 'px');

    recentre();
  }

  alignToHeadline();
  window.addEventListener('resize', alignToHeadline);
  // The headline's lines change when the web font arrives or the column
  // gets narrower: measure again.
  if (document.fonts) {
    document.fonts.ready.then(alignToHeadline);
    document.fonts.addEventListener('loadingdone', alignToHeadline);
  }
  if (title && 'ResizeObserver' in window) {
    new ResizeObserver(alignToHeadline).observe(title);
  }

  /* Scroll the column so tile `index` is centred (snapping off
     until the scroll has ended, see settle()) */
  function scrollToTile(index, smooth) {
    const clamped = Math.max(0, Math.min(tiles.length - 1, index));
    targetIndex = clamped;
    setSnap(false);
    column.scrollTo({
      top: tileTop(clamped),
      behavior: smooth && !reducedMotion.matches ? 'smooth' : 'auto'
    });
    waitForScrollEnd(SCROLL_END_DELAY); // also covers "already there": no scroll events
  }

  /* Mark the centre tile as active and update the labels */
  function setActive(index) {
    if (index === activeIndex || !tiles[index]) return;
    // Every tile knows where it is relative to the active one:
    // above (.is-before), centre (.is-active) or below (.is-after).
    // CSS uses this to shrink inactive covers toward the centre.
    tiles.forEach((tile, i) => {
      tile.classList.toggle('is-before', i < index);
      tile.classList.toggle('is-active', i === index);
      tile.classList.toggle('is-after', i > index);
    });
    activeIndex = index;
    lastActiveChange = performance.now();

    // Only touch the labels when the project actually changes,
    // so screen readers don't repeat the same name.
    const projectIndex = index % COUNT;
    if (projectIndex !== activeProject) {
      activeProject = projectIndex;
      nameLabel.textContent = PROJECTS[projectIndex].name;
      roleLabel.textContent = PROJECTS[projectIndex].role;
    }
  }

  /* Infinite loop: when scrolling has stopped in the first or last copy,
     jump to the same tile in the middle copy. For the jump to be
     invisible, everything on screen must be identical before and after:
     - distance: the real distance between the two tiles (offsetTop),
       added to the current scrollTop;
     - tile states: we wait until the fade/scale of the last change has
       finished, then switch transitions off for the jump, so the tiles
       we land on are in exactly the same state as the ones we left;
     - videos: the three tiles on screen pass their playback position on. */
  function loopJump(index, jumpTo) {
    for (let offset = -1; offset <= 1; offset++) {
      const from = videos[index + offset];
      const to = videos[jumpTo + offset];
      if (from && to && Math.abs(to.currentTime - from.currentTime) > 0.04) {
        to.currentTime = from.currentTime;
      }
    }

    setSnap(false);
    column.classList.add('no-transition');
    column.scrollTo({
      top: column.scrollTop + tiles[jumpTo].offsetTop - tiles[index].offsetTop,
      behavior: 'auto'
    });
    setActive(jumpTo);
    void column.offsetHeight; // force the browser to apply the styles now
    requestAnimationFrame(() => {
      requestAnimationFrame(() => column.classList.remove('no-transition'));
    });
  }

  /* Runs when scrolling has ended: loop jump if needed, snapping back on */
  function settle() {
    if (isTouching) return; // wait until the finger is lifted
    targetIndex = null;

    const index = nearestIndex();
    let jumpTo = index;
    if (index < START) jumpTo = index + COUNT;
    else if (index >= START + COUNT) jumpTo = index - COUNT;

    if (jumpTo !== index) {
      // Tiles still fading / scaling: jump when they have finished
      const wait = TRANSITION_MS - (performance.now() - lastActiveChange);
      if (wait > 0) {
        setSnap(true);
        waitForScrollEnd(wait);
        return;
      }
      loopJump(index, jumpTo);
    }
    setSnap(true);
  }

  // One timer for "scrolling has ended"; every scroll event restarts it
  function waitForScrollEnd(delay) {
    clearTimeout(scrollEndTimer);
    scrollEndTimer = setTimeout(settle, delay);
  }

  /* --- Scrolling --- */
  column.addEventListener('scroll', () => {
    setActive(nearestIndex());
    waitForScrollEnd(SCROLL_END_DELAY);
  }, { passive: true });

  // Browsers with the scrollend event tell us straight away; the timer
  // above is the fallback. Ignore it if a script scroll was replaced by
  // a new one and hasn't arrived yet.
  column.addEventListener('scrollend', () => {
    if (targetIndex !== null && Math.abs(column.scrollTop - tileTop(targetIndex)) > 1) return;
    waitForScrollEnd(0);
  });

  /* --- Pausing --- */

  // Any user input pauses auto-advance for 4 seconds.
  // It also turns label announcements on (they're off during autoplay,
  // so screen readers aren't interrupted every 3 seconds).
  function pauseForUser() {
    pausedUntil = Date.now() + USER_PAUSE;
    nameLabel.setAttribute('aria-live', 'polite');
  }

  // The user takes over: the browser's own snapping is back in charge
  column.addEventListener('wheel', () => {
    targetIndex = null;
    setSnap(true);
    pauseForUser();
  }, { passive: true });

  column.addEventListener('touchstart', () => {
    isTouching = true;
    targetIndex = null;
    setSnap(true);
    pauseForUser();
  }, { passive: true });

  ['touchend', 'touchcancel'].forEach((type) => {
    column.addEventListener(type, () => {
      isTouching = false;
      pauseForUser();
      waitForScrollEnd(SCROLL_END_DELAY);
    }, { passive: true });
  });

  // Keyboard: ↑ / ↓ move one tile when the column is focused
  column.addEventListener('keydown', (event) => {
    pauseForUser();
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    const from = targetIndex !== null ? targetIndex : activeIndex;
    scrollToTile(from + (event.key === 'ArrowDown' ? 1 : -1), true);
  });

  // Mouse over the column: pause (mouse only, so a tap doesn't
  // leave it paused forever on touch screens)
  stage.addEventListener('pointerenter', (event) => {
    if (event.pointerType === 'mouse') isHovering = true;
  });
  stage.addEventListener('pointerleave', () => { isHovering = false; });

  // Keyboard focus inside the column: pause, so the tile doesn't move away
  column.addEventListener('focusin', () => { hasFocus = true; });
  column.addEventListener('focusout', (event) => {
    if (!column.contains(event.relatedTarget)) hasFocus = false;
  });

  // Don't animate (or play videos) while the hero is off screen
  new IntersectionObserver(([entry]) => {
    isOnScreen = entry.isIntersecting;
    updateVideos();
  }).observe(column);

  /* --- Auto-advance --- */
  setInterval(() => {
    const paused = reducedMotion.matches || isHovering || hasFocus || isTouching ||
      !isOnScreen || document.hidden || Date.now() < pausedUntil;
    if (paused) return;
    nameLabel.setAttribute('aria-live', 'off');
    scrollToTile(activeIndex + 1, true);
  }, AUTO_DELAY);

  /* --- Start on the first tile of the middle copy, no animation --- */
  scrollToTile(START, false);
  setActive(START);
  targetIndex = null;
}


/* =========================================================
   2. Side menu (desktop only, hidden by CSS below 900px)
   ========================================================= */
function initSideMenu() {
  const menu = document.querySelector('.side-menu');
  const anchor = document.querySelector('.side-menu-anchor');
  if (!menu || !anchor) return;

  const links = menu.querySelectorAll('.side-nav a');
  const darkSections = document.querySelectorAll('[data-dark]');
  const navSections = document.querySelectorAll('[data-nav]');

  const footer = document.querySelector('.site-footer');
  // Case study pages: the menu stays hidden until it pins (the header nav is enough)
  const revealOnPin = menu.hasAttribute('data-reveal-on-pin');

  /* --- a. Pin, show and hide the menu ---
     Pin: the menu starts at its anchor (absolute): after the hero on the
     homepage, right after the header on a case study page. When the anchor
     reaches the top of the screen, the menu becomes fixed.
     Hide: the menu never sits on top of the footer. As soon as the footer's
     top edge reaches the menu's bottom edge, it fades out; scrolling back
     up fades it in again. Hiding only changes opacity/visibility, never
     the layout, so the two edges can't push each other back and forth
     (no flicker at the threshold).
     We use the scroll event rather than an IntersectionObserver because it
     runs before each frame is drawn, so pinning and hiding are never a
     frame late. Same code for both pages. */
  function updatePin() {
    const pinned = anchor.getBoundingClientRect().top <= 0;
    menu.classList.toggle('is-pinned', pinned);
    document.body.classList.toggle('side-menu-pinned', pinned); // hides the header nav

    const footerReached = footer !== null &&
      footer.getBoundingClientRect().top <= menu.getBoundingClientRect().bottom;
    const hidden = (revealOnPin && !pinned) || footerReached;

    if (hidden !== menu.classList.contains('is-hidden')) {
      menu.classList.toggle('is-hidden', hidden); // CSS fades it out/in
      // inert: a hidden menu can't be focused or clicked, even mid-fade
      menu.inert = hidden;
    }
  }
  window.addEventListener('scroll', updatePin, { passive: true });
  window.addEventListener('resize', updatePin);
  updatePin();

  /* --- b. Colour: white over the blue band (homepage) ---
     Each menu item (the name and every link) checks its own background,
     because the band's edge can pass through the middle of the menu.
     For each item we watch a 1px line across the screen at the item's
     height. If a dark section crosses that line, the item turns white.
     (The footer doesn't need this: the menu hides before reaching it.) */
  // The name, the main links, and the sub-list (its line and its links)
  const subnavs = [...menu.querySelectorAll('.side-subnav')];
  const items = [menu.querySelector('.side-name'), ...links, ...subnavs,
    ...menu.querySelectorAll('.side-subnav a')];
  let darkObservers = [];

  function watchDarkSections() {
    darkObservers.forEach((observer) => observer.disconnect());
    darkObservers = items.map((item) => {
      // Item's vertical centre when the menu is pinned (menu top = 0).
      // For a sub-list it's the top edge: that's where its 1px line is.
      const line = Math.round(subnavs.includes(item)
        ? item.offsetTop
        : item.offsetTop + item.offsetHeight / 2);
      const bottom = Math.max(0, window.innerHeight - line - 1);
      const darkInView = new Set();

      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) darkInView.add(entry.target);
          else darkInView.delete(entry.target);
        });
        item.classList.toggle('is-on-dark', darkInView.size > 0);
      }, { rootMargin: `-${line}px 0px -${bottom}px 0px` });

      darkSections.forEach((section) => observer.observe(section));
      return observer;
    });
  }
  watchDarkSections();
  // Web fonts change the item heights slightly, so measure again once they load
  if (document.fonts) document.fonts.ready.then(watchDarkSections);

  // The line is measured in pixels, so rebuild it when the window resizes
  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(watchDarkSections, 150);
  });

  /* --- c. Active item: follows the section in the middle of the screen ---
     Sections say which item they belong to with data-nav="work|about";
     links say which item they are with data-nav-link="...".
     Homepage: landing and Work → Work; My story, the blue band, Education,
     Skills and AI → About. The footer has no item, so About stays current
     until the menu hides.
     A sub-list with data-subnav-for="about" is shown only while About is
     the current item (its own links are handled in d. below).
     Case study pages: page content → Work. */
  const inView = new Set();
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) inView.add(entry.target);
      else inView.delete(entry.target);
    });

    // If two sections touch the middle, use the lower one
    let current = null;
    navSections.forEach((section) => {
      if (inView.has(section)) current = section.dataset.nav;
    });
    if (!current) return;

    links.forEach((link) => {
      if (link.dataset.navLink === current) {
        link.setAttribute('aria-current', 'true');
      } else {
        link.removeAttribute('aria-current');
      }
    });

    // Show the current item's sub-list, hide the others
    let changed = false;
    subnavs.forEach((subnav) => {
      if (!subnav.dataset.subnavFor) return;
      const hide = subnav.dataset.subnavFor !== current;
      if (subnav.hidden !== hide) {
        subnav.hidden = hide;
        changed = true;
      }
    });
    if (changed) {
      watchDarkSections(); // the sub-items now have (or lost) a position
      updatePin();         // the menu's height changed: re-check the footer
    }
  }, { rootMargin: '-49% 0px -50% 0px' });
  navSections.forEach((section) => sectionObserver.observe(section));

  /* --- d. Sub-list links follow the section in view ---
     Only when the sub-nav has data-spy (the About sub-list on the
     homepage, "On this page" on case study pages). Each link points to a
     section (href="#id"); the section crossing the middle of the screen
     is current (CSS turns it blue). Between sections, e.g. the TL;DR
     after the hero, the previous link simply stays current.
     data-spy-line="25" moves that line from the middle to 25% from the
     top. The homepage needs it: Education and Skills are two short rows,
     so after jumping to Education the middle is already in Skills. */
  const spyNav = menu.querySelector('.side-subnav[data-spy]');
  if (spyNav) {
    // Links inside a .side-subgroup are an item's sub-headings: see e. below
    const pairs = Array.from(spyNav.querySelectorAll('a[href^="#"]'))
      .filter((link) => !link.closest('.side-subgroup'))
      .map((link) => ({ link, section: document.getElementById(link.hash.slice(1)) }))
      .filter((pair) => pair.section);
    const groups = [...spyNav.querySelectorAll('.side-subgroup')];
    const spyInView = new Set();
    const spyLine = Number(spyNav.dataset.spyLine) || 49;

    const spyObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) spyInView.add(entry.target);
        else spyInView.delete(entry.target);
      });

      // If two sections touch the middle, use the lower one
      let current = null;
      pairs.forEach((pair) => {
        if (spyInView.has(pair.section)) current = pair;
      });
      if (!current) return;

      // In a gap inside a section that holds other items' sections (the
      // homepage's Education holds Skills and CV), the last of those
      // that has started above the line stays current
      const line = window.innerHeight * spyLine / 100;
      const holder = current.section;
      pairs.forEach((pair) => {
        if (pair.section !== holder && holder.contains(pair.section) &&
            pair.section.getBoundingClientRect().top <= line) current = pair;
      });

      pairs.forEach((pair) => {
        if (pair === current) pair.link.setAttribute('aria-current', 'location');
        else pair.link.removeAttribute('aria-current');
      });

      // A group of sub-headings shows only while the link just above it
      // is the current one
      let changed = false;
      groups.forEach((group) => {
        const hide = group.previousElementSibling !== current.link;
        if (group.hidden !== hide) {
          group.hidden = hide;
          changed = true;
        }
      });
      if (changed) {
        updateSubHeadings();
        watchDarkSections(); // items below the group moved
        updatePin();         // the menu's height changed: re-check the footer
      }
    }, { rootMargin: `-${spyLine}% 0px -${99 - spyLine}% 0px` });
    pairs.forEach((pair) => spyObserver.observe(pair.section));

    /* --- e. Sub-headings inside the current section ---
       A heading is only one line tall, so it can't be "the section
       crossing the line". Instead: the current sub-item is the last
       heading that has passed a line a quarter of the way down the
       screen. Before the first heading, none is current. */
    const subHeadings = groups.map((group) =>
      Array.from(group.querySelectorAll('a[href^="#"]'))
        .map((link) => ({ link, heading: document.getElementById(link.hash.slice(1)) }))
        .filter((item) => item.heading));

    /* data-spy-sub-line="130" sets that line in px from the top instead.
       WaitWell needs it while its sub-headings have no content under
       them: they sit so close together that the next one is already
       above the quarter line after jumping to one. */
    const subLine = Number(spyNav.dataset.spySubLine);

    function updateSubHeadings() {
      const line = subLine || window.innerHeight * 0.25;
      groups.forEach((group, i) => {
        if (group.hidden) return;
        let current = null;
        subHeadings[i].forEach((item) => {
          if (item.heading.getBoundingClientRect().top <= line) current = item;
        });
        subHeadings[i].forEach((item) => {
          if (item === current) item.link.setAttribute('aria-current', 'location');
          else item.link.removeAttribute('aria-current');
        });
      });
    }
    if (groups.length) {
      window.addEventListener('scroll', updateSubHeadings, { passive: true });
      window.addEventListener('resize', updateSubHeadings);
    }
  }
}


/* =========================================================
   3. Work section: hide a row's peek image if it doesn't fit
   The peek sits 20px after the row's arrow, so how far right it reaches
   depends on the title's width. If it would stick out past the right
   edge of the main column, that row gets .peek-off (CSS hides its peek).
   ========================================================= */
function initWorkPeeks() {
  const rows = document.querySelectorAll('.row');
  if (!rows.length) return;

  const GAP = 20;   // space between arrow and peek (same as in work.css)
  const RING = 8;   // the red frame (box-shadow) reaches 8px outside the image

  function checkPeeks() {
    rows.forEach((row) => {
      const wrap = row.querySelector('.row-arrow-wrap');
      const peek = row.querySelector('.row-peek');
      if (!wrap || !peek) return;
      // Below 1280px the peek is display:none and has no width; nothing to do
      const peekWidth = peek.offsetWidth;
      if (!peekWidth) {
        row.classList.remove('peek-off');
        return;
      }
      // The wrapper never moves on hover, so this is where the peek really goes
      const peekRight = wrap.getBoundingClientRect().right + GAP + peekWidth + RING;
      const columnRight = row.getBoundingClientRect().right;
      row.classList.toggle('peek-off', peekRight > columnRight);
    });
  }

  checkPeeks();
  // Titles get wider once the web font loads, so check again then
  if (document.fonts) document.fonts.ready.then(checkPeeks);
  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(checkPeeks, 100);
  });
}


/* ---------- Start ---------- */
/* =========================================================
   5. WaitWell hero video: its distance from the top of the page
   [data-hero-video] is the full-bleed box of the hero video. case.css
   keeps the video no taller than the screen below that point
   (100svh - --hero-top); the header's height changes with the width
   (it wraps on phones) and with the fonts, so it is measured here.
   ========================================================= */
function initHeroVideo() {
  const block = document.querySelector('[data-hero-video]');
  if (!block) return;

  function measure() {
    // The box itself is never animated, so its position is reliable
    const top = block.getBoundingClientRect().top + window.scrollY;
    block.style.setProperty('--hero-top', Math.round(top) + 'px');
  }

  measure();
  window.addEventListener('resize', measure);
  window.addEventListener('load', measure);
  if (document.fonts) document.fonts.ready.then(measure);
}


/* =========================================================
   6. Screens strip arrow buttons
   [data-strip-controls="<strip id>"] holds a previous and a next
   button. Each click moves the strip by about its visible width,
   landing on the start of a screen: next goes to the first screen
   that isn't fully in view, previous goes back by the same amount.
   Smooth scrolling, instant with reduced motion. At either end that
   button gets the disabled attribute; this is updated on scroll,
   swipe and resize. If the focused button becomes disabled, focus
   moves to the other one so it isn't lost.
   ========================================================= */
function initStripControls() {
  document.querySelectorAll('[data-strip-controls]').forEach((controls) => {
    const strip = document.getElementById(controls.dataset.stripControls);
    const prev = controls.querySelector('[data-strip-prev]');
    const next = controls.querySelector('[data-strip-next]');
    if (!strip || !prev || !next) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

    // Each screen's start, in the strip's own scroll coordinates
    const starts = () => {
      const left = strip.getBoundingClientRect().left - strip.scrollLeft;
      return [...strip.children].map((el) => Math.round(el.getBoundingClientRect().left - left));
    };
    const maxScroll = () => strip.scrollWidth - strip.clientWidth;

    function go(dir) {
      const list = starts();
      const x = strip.scrollLeft;
      const view = strip.clientWidth;
      let target;
      if (dir > 0) {
        // First screen whose right edge is past the visible area
        const i = [...strip.children].findIndex((el, n) => list[n] + el.offsetWidth > x + view + 1);
        target = i === -1 ? maxScroll() : list[i];
      } else {
        // Back one view; land on the first screen that starts there or later
        const want = x - view;
        target = want <= 0 ? 0 : list.find((start) => start >= want - 1);
      }
      strip.scrollTo({
        left: Math.max(0, Math.min(target, maxScroll())),
        behavior: reduce.matches ? 'auto' : 'smooth'
      });
    }

    function update() {
      const x = strip.scrollLeft;
      const atStart = x <= 1;
      const atEnd = x >= maxScroll() - 1;
      [[prev, atStart, next], [next, atEnd, prev]].forEach(([btn, off, other]) => {
        if (off && document.activeElement === btn && !other.disabled) other.focus();
        btn.disabled = off;
      });
    }

    let frame = 0;
    const queue = () => {
      if (!frame) frame = requestAnimationFrame(() => { frame = 0; update(); });
    };

    prev.addEventListener('click', () => go(-1));
    next.addEventListener('click', () => go(1));
    strip.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', queue);
    window.addEventListener('load', update);
    update();
  });
}


/* =========================================================
   7. CV: "View my CV" row + CV sheet (homepage)
   The pages come from CV_PAGES (one image per page); the peek on the
   row shows a small page 1 (CV_PEEK). Opening:
   page 1 grows out of the peek (or the arrow below 1280px, where
   there is no peek), then the sheet around it fades in. Closing is
   the reverse. index.html#cv (the footer CV links on other pages)
   opens it straight away, scrolled to the button.
   ========================================================= */

/* The CV pages, made from assets/cv/merve-uzuner-cv.pdf (one PNG per
   page, 1700px wide), and the peek: page 1 at 312px wide (156px at
   2x). A new CV: see "CV" in the README. */
const CV_PAGES = [
  'assets/cv/cv-page-1.png'
];
const CV_PEEK = 'assets/cv/cv-peek.png';

// One CV page, alt "CV, page 1 of N". The full-size images get their
// src later (see initCvSheet), so they don't slow the homepage's load.
function cvPage(index, total) {
  const img = document.createElement('img');
  img.className = 'cv-page';
  img.alt = 'CV, page ' + (index + 1) + ' of ' + total;
  img.decoding = 'async';
  return img;
}

function initCvSheet() {
  const button = document.getElementById('cv');
  const dialog = document.querySelector('.cv-view');
  if (!button || !dialog) return;

  const peek = button.querySelector('.cv-peek');
  const arrow = button.querySelector('.row-arrow');
  const scroller = dialog.querySelector('.cv-scroll');
  const sheet = dialog.querySelector('.cv-sheet');
  const pagesBox = dialog.querySelector('.cv-pages');
  const closeButton = dialog.querySelector('.cv-close');

  // Build the pages, and the peek's small page 1 (decorative, alt "")
  const pages = CV_PAGES.map((src, i) => pagesBox.appendChild(cvPage(i, CV_PAGES.length)));
  const small = document.createElement('img');
  small.className = 'cv-page';
  small.src = CV_PEEK;
  small.alt = '';
  peek.appendChild(small);

  // The full-size pages load once the rest of the page has loaded, or
  // as soon as someone heads for the button, whichever comes first
  function loadPages() {
    pages.forEach((img, i) => { if (!img.src) img.src = CV_PAGES[i]; });
  }
  if (document.readyState === 'complete') loadPages();
  else window.addEventListener('load', loadPages, { once: true });
  button.addEventListener('pointerenter', loadPages, { once: true });
  button.addEventListener('focus', loadPages, { once: true });

  const first = pages[0];
  // Everything but page 1: fades in once page 1 has landed
  const rest = [
    dialog.querySelector('.cv-paper'),
    dialog.querySelector('.cv-bar'),
    ...Array.from(pagesBox.children).slice(1)
  ];

  const EASE = 'cubic-bezier(.2, .8, .2, 1)';
  const GROW = 550;      // page 1: peek -> sheet
  const SHRINK = 400;    // page 1: sheet -> peek
  const FADE_IN = 200;
  const FADE_OUT = 150;
  let state = 'closed';  // closed | opening | open | closing

  function lockPage(on) {
    const root = document.documentElement.style;
    root.overflow = on ? 'hidden' : '';
    root.scrollbarGutter = on ? 'stable' : '';
  }

  // Where page 1 grows from / shrinks back to: the peek where there is
  // one (1280px and up, and it fits), otherwise the arrow
  function originBox() {
    const usePeek = peek.offsetWidth > 0 && !button.classList.contains('peek-off');
    return (usePeek ? peek : arrow).getBoundingClientRect();
  }

  // The transform that puts page 1 over `box`: same height, centred on it
  function over(box) {
    const page = first.getBoundingClientRect();
    const s = box.height / page.height;
    const x = box.left + box.width / 2 - page.left - page.width * s / 2;
    const y = box.top + box.height / 2 - page.top - page.height * s / 2;
    return 'translate(' + x + 'px, ' + y + 'px) scale(' + s + ')';
  }

  function stop(el) {
    el.getAnimations().forEach((a) => a.cancel());
  }

  // Fade everything but page 1 to `to` (0 or 1)
  function fade(to, duration) {
    return Promise.all(rest.map((el) => {
      const from = getComputedStyle(el).opacity;
      stop(el);
      el.style.opacity = to;
      return el.animate([{ opacity: from }, { opacity: to }], { duration, easing: 'ease' })
        .finished.catch(() => {});
    }));
  }

  // instant: no animation (index.html#cv, footer link, reduced motion)
  async function open(instant) {
    if (state !== 'closed') return;
    state = 'opening';
    loadPages();
    const from = originBox();   // measured before the page is locked

    lockPage(true);
    dialog.showModal();
    scroller.scrollTop = 0;
    closeButton.focus({ preventScroll: true });
    button.classList.add('is-lifted');

    if (instant || reducedMotion.matches) {
      state = 'open';
      return;
    }

    rest.forEach((el) => { el.style.opacity = 0; });
    const grow = first.animate(
      [{ transform: over(from) }, { transform: 'none' }],
      { duration: GROW, easing: EASE }
    );
    try {
      await grow.finished;
    } catch (e) {
      return; // closed while growing
    }
    if (state !== 'opening') return;
    state = 'open';
    await fade(1, FADE_IN);
  }

  async function close() {
    if (state !== 'opening' && state !== 'open') return;
    state = 'closing';

    if (reducedMotion.matches) {
      finish();
      return;
    }

    // Closed mid-opening: carry on from where page 1 is now
    const now = getComputedStyle(first).transform;
    stop(first);
    first.style.transform = now === 'none' ? '' : now;

    await fade(0, FADE_OUT);
    if (state !== 'closing') return;

    first.style.transform = '';
    const target = over(originBox());
    const shrink = first.animate([
      { transform: now, opacity: 1 },
      { opacity: 1, offset: .75 },
      { transform: target, opacity: 0 }
    ], { duration: SHRINK, easing: EASE, fill: 'forwards' });
    try {
      await shrink.finished;
    } catch (e) {
      return;
    }
    finish();
  }

  // Closed: back to the page, focus on the button
  function finish() {
    if (state === 'closed') return;
    state = 'closed';
    if (dialog.open) dialog.close();
    stop(first);
    first.style.transform = '';
    rest.forEach((el) => { stop(el); el.style.opacity = ''; });
    lockPage(false);
    button.classList.remove('is-lifted');
    button.focus({ preventScroll: true });
    // Drop #cv from the address, so a reload doesn't reopen the sheet
    if (location.hash === '#cv') history.replaceState(null, '', location.pathname + location.search);
  }

  // From a link (footer, index.html#cv): bring the button into view,
  // then open at once
  function openFromLink() {
    button.scrollIntoView({ block: 'center', behavior: 'instant' });
    open(true);
  }

  button.addEventListener('click', () => open(false));

  document.querySelectorAll('[data-cv-open]').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      openFromLink();
    });
  });

  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    close();
  });

  // Anywhere outside the sheet closes it
  dialog.addEventListener('click', (event) => {
    if (!sheet.contains(event.target)) close();
  });
  closeButton.addEventListener('click', close);

  dialog.addEventListener('close', finish);

  if (location.hash === '#cv') {
    openFromLink();
    // The browser jumps to #cv itself once the page has loaded, and
    // that takes focus off the ×: centre the button and focus × again
    window.addEventListener('load', () => {
      if (state !== 'open') return;
      button.scrollIntoView({ block: 'center', behavior: 'instant' });
      closeButton.focus({ preventScroll: true });
    }, { once: true });
  }
}


initCoverColumn();
initSideMenu();
initWorkPeeks();
initHeroVideo();
initStripControls();
initCvSheet();
