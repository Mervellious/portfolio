/* Studio page: the work sheets and the artwork sheets, with no
   backdrop (the studio stays exactly as it is behind them).
   Every wall item hangs slightly tilted (--tilt on its button, in deg).
   When it opens, the image straightens while it lifts off the wall;
   when it closes, it tilts back as it settles.
   Strip boxes 1–5 open their work sheet, and the artworks (ART 1–6)
   their artwork sheet: the same dialog and behaviour for both (below). */

// Where a wall item's image is right now, on screen: its centre, size
// and turn (deg). Read from the image's live transform, so it includes
// the tilt and, while hovered or focused, the small lift. The button
// itself isn't turned, so its box is the image's box at rest.
function poseOf(item) {
  const box = item.getBoundingClientRect();
  const img = item.querySelector('img');
  const m = new DOMMatrix(img ? getComputedStyle(img).transform : 'none');
  const scale = Math.hypot(m.a, m.b);
  return {
    cx: box.left + box.width / 2 + m.e,
    cy: box.top + box.height / 2 + m.f,
    w: box.width * scale,
    h: box.height * scale,
    turn: Math.atan2(m.b, m.a) * 180 / Math.PI
  };
}

// The same item at rest and straight (the base of the lift-off)
function straightOf(item) {
  const box = item.getBoundingClientRect();
  return { cx: box.left + box.width / 2, cy: box.top + box.height / 2, w: box.width, h: box.height, turn: 0 };
}

/* Work sheets (strip boxes 1–5) and artwork sheets (ART 1–6).
   - Every sheet comes from SHEETS below: its design height, how it
     fits, the text block (subtitle optional), the title block and the
     images (px from the
     sheet's top-left corner, on a 1240-wide design). The first image
     is the cover, the one that grows from the strip box. Each strip
     box names its entry with data-sheet="<key>".
   - 600px and up: the sheet is one 1240-wide layer, scaled.
     fit: 'screen' fits it below the header (at most 1240 wide, the
     screen width minus 40px, and the space below the header minus
     40px), centred. fit: 'width' scales it to the width only, and it
     scrolls below the header; the × stays in view.
   - Below 600px: not scaled; the same content in one column (CSS).
   - Open: the cover lifts off the wall (150ms: up 6px, scale 1.03),
     then glides and grows into its place on the sheet (400ms). Then
     the rest of the sheet fades in around it (200ms). The page behind
     doesn't scroll while a sheet is open.
   - FLIP, transform only: the cover's box moves and scales from the
     strip box's measured place to its place on the sheet; the image
     inside is counter-scaled every step, so it scales evenly (like
     object-fit: cover) and never stretches while the box changes
     shape.
   - Close (Escape, a click outside the sheet, or ×): the sheet fades
     out, then the cover goes back to its box and settles. Focus goes
     back to the box.
   - Reduced motion: it simply appears and disappears.
   - Artwork sheets (.studio-art): built from the frame itself (its
     image, data-title, data-note), not from SHEETS. Only the artwork
     and, to its right, a 300px text column (handwritten title and
     description), 48px inside the inner frame and 48px apart. 600px
     and up: laid out in screen px, not scaled: the image is as tall as
     the space below the header allows (minus the 20px margins, the
     frames and the padding), at its own proportions, uncropped; the
     sheet's width follows. If that is wider than the screen, the image
     gets narrower instead. Below 600px: the work sheets' one column,
     the image first, then the text. */

const SHEETS = {
  elle: {
    height: 851,
    fit: 'screen',
    title: 'ELLE Magazine',
    subtitle: 'March issue',
    text: 'I designed the set for ELLE Magazine, managing the whole process from initial concept and sketches to set dressing and final installation.',
    textBox: { left: 990, top: 48, width: 210 },
    project: 'ELLE Magazine · March issue',
    role: 'Set Designer',
    titleBox: { right: 40, bottom: 48, width: 210 },
    images: [
      { src: 'work1_cover.jpg', left: 40, top: 48, width: 560, height: 350, alt: 'Set render: mirrored vertical slats in front of red and blue walls, with round white discs on the floor' },
      { src: 'work1_d.jpg', left: 630, top: 48, width: 232, height: 345, alt: 'On set: a model in black stands between mirrored slats, with red and blue walls behind' },
      { src: 'work1_c.jpg', left: 40, top: 430, width: 560, height: 373, alt: 'On set: a model in black leather lies across a large circular opening in a blue wall, with a red light behind' },
      { src: 'work1_b.jpg', left: 630, top: 430, width: 282, height: 176, alt: 'Render of the whole set in a white room: red and blue walls, a curved rocker, mirrored slats and a white disc' },
      { src: 'work1_a.jpg', left: 630, top: 627, width: 282, height: 176, alt: 'Render: a red wall with an arch next to a blue wall with a circular cut-out and a curved rocker' },
      { src: 'work1_e.jpeg', left: 990, top: 430, width: 190, height: 249, alt: 'ELLE March 2019 cover, shot on the set: the model lies across the red circle' }
    ]
  },
  nesine: {
    height: 1700,
    fit: 'width',
    title: 'Nesine.com',
    subtitle: 'TV commercial',
    text: 'I art-directed the set for a Nesine.com TV commercial, managing the whole process from concept sketches and technical 3D drawings to the final set installation.',
    textBox: { left: 830, top: 48, width: 340 },
    project: 'Nesine.com · TV commercial',
    role: 'Art Director',
    titleBox: { left: 830, top: 385, width: 210 },
    images: [
      { src: 'work2_cover.jpg', left: 40, top: 48, width: 760, height: 427, alt: 'Render of the yellow set: arches, stacked square frames, a basketball hoop, a goal and two curved ramps on a yellow floor' },
      { src: 'work2_a.jpg', left: 40, top: 505, width: 620, height: 286, alt: 'Hand-coloured concept sketch of the set, with a long yellow curved ramp wrapping around the stage' },
      { src: 'work2_e.jpg', left: 690, top: 505, width: 510, height: 286, alt: 'SketchUp model of the set: yellow columns, steps, arches, square frames and curved ramps' },
      { src: 'work2_c.jpeg', left: 40, top: 821, width: 328, height: 438, alt: 'Build photo: a bare wooden ramp on a steel frame in the studio, with arches and yellow walls behind' },
      { src: 'work2_b.jpg', left: 398, top: 821, width: 802, height: 438, alt: 'The finished yellow set in the studio: arches, a stage with steps, a curved ramp and a screen' },
      { src: 'work2_f.jpg', left: 40, top: 1289, width: 646, height: 363, alt: 'Render of the yellow set from above: columns, arches, square frames, a goal and the curved ramp' },
      { src: 'work2_d.jpg', left: 716, top: 1289, width: 484, height: 363, alt: 'Merve Uzuner sitting inside a U-shaped yellow arch on the finished set' }
    ]
  },
  lfw: {
    height: 1515,
    fit: 'width',
    title: 'London Fashion Week',
    subtitle: 'Runway live show',
    text: 'I designed the set for a live runway show at London Fashion Week, managing the whole process from concept and technical 3D drawings to the final installation on site.',
    textBox: { left: 700, top: 48, width: 460 },
    project: 'London Fashion Week · Runway live show',
    role: 'Set Designer',
    titleBox: { left: 700, top: 236, width: 300 },
    images: [
      { src: 'work3_cover.jpg', left: 40, top: 48, width: 631, height: 590, alt: 'Render of the race-track set: pink, yellow and blue lanes, a chequered finish and a curved track running up the back wall' },
      { src: 'work3_c.jpg', left: 700, top: 353, width: 500, height: 285, alt: 'SketchUp drawing of the set with dimensions: a 5000 mm curved track on a 3450 mm back wall' },
      { src: 'work3_a.jpg', left: 40, top: 668, width: 788, height: 480, alt: "The whole cast on the finished runway set, posing across the lanes, a hurdle and a winners' podium" },
      { src: 'work3_b.jpg', left: 857, top: 668, width: 343, height: 480, alt: 'A model in a blue tracksuit crouching on the chequered floor, with other models behind' },
      { src: 'work3_d.jpg', left: 40, top: 1178, width: 188, height: 289, alt: 'Merve Uzuner and a crew member taping lane lines on the floor, next to a yellow ladder' },
      { src: 'work3_e.jpg', left: 258, top: 1178, width: 435, height: 289, alt: 'Merve Uzuner leaning on a hurdle on the finished set, with guests behind' },
      { src: 'work3_f.jpg', left: 725, top: 1178, width: 475, height: 289, alt: 'The set being painted on the day of the show, with people on ladders and models walking through' }
    ]
  },
  nike: {
    height: 1064,
    fit: 'width',
    title: 'Nike',
    text: 'I designed the set for a Nike shoot, managing the whole process from concept and 3D renders through to the build and final set dressing.',
    textBox: { left: 640, top: 48, width: 460 },
    project: 'Nike',
    role: 'Set Designer',
    titleBox: { left: 640, top: 273, width: 300 },
    images: [
      { src: 'work4_cover.jpg', left: 40, top: 48, width: 560, height: 315, alt: 'Render of the pink set: free-standing pink walls, one with an arched opening, a low platform and small steps' },
      { src: 'work4_a.jpg', left: 40, top: 393, width: 565, height: 318, alt: 'Render, close view: the low pink platform in front of tall pink back walls' },
      { src: 'work4_b.jpg', left: 635, top: 393, width: 565, height: 318, alt: 'Render, wide view: pink walls of different heights around the low platform' },
      { src: 'work4_c.jpg', left: 40, top: 741, width: 367, height: 275, alt: 'Build photo: the raw, unpainted walls, platform and steps in the studio, with a stepladder' },
      { src: 'work4_d.jpg', left: 437, top: 741, width: 366, height: 275, alt: 'The finished pink set in the studio: painted walls with an arch, steps and the platform under studio lights' },
      { src: 'work4_e.jpg', left: 833, top: 741, width: 367, height: 275, alt: 'Detail of the finished set: small white and copper steps between pink walls' }
    ]
  },
  macfit: {
    height: 1157,
    fit: 'width',
    title: 'MacFit',
    text: 'I designed the set for a MacFit shoot, managing the whole process from concept and technical 3D drawings to the hand-painted set installation.',
    textBox: { left: 720, top: 48, width: 440 },
    project: 'MacFit',
    role: 'Set Designer',
    titleBox: { left: 720, top: 335, width: 300 },
    images: [
      { src: 'work5_cover.jpg', left: 40, top: 48, width: 640, height: 377, alt: 'Render of the blue court-graphic set: a wall curving into the floor, painted with white and yellow court lines' },
      { src: 'work5_c.jpg', left: 40, top: 455, width: 565, height: 276, alt: 'SketchUp drawing of the set walls with dimensions: a brick-pattern wall, a wall with a doorway and a striped wall' },
      { src: 'work5_d.jpg', left: 635, top: 455, width: 565, height: 276, alt: 'SketchUp drawing of the wall elements set out in a row, each with its dimensions' },
      { src: 'work5_a.jpg', left: 40, top: 761, width: 578, height: 348, alt: 'Render of the orange court-graphic set: a wall curving into the floor, painted with white and yellow court lines' },
      { src: 'work5_b.jpg', left: 648, top: 761, width: 261, height: 348, alt: 'Build photo: the blue court floor laid out in the studio, with white and yellow lines' },
      { src: 'work5_e.jpg', left: 939, top: 761, width: 261, height: 348, alt: 'Build photo: a painter hand-painting the orange court graphic on the curved wall, with ladders on each side' }
    ]
  }
};

(function () {
  const dialog = document.querySelector('.sheet-view');
  const openers = document.querySelectorAll('.studio-work[data-sheet], .studio-art');
  if (!dialog || !openers.length) return;

  const scroller = dialog.querySelector('.sheet-scroll');
  const sizer = dialog.querySelector('.sheet-sizer');
  const sheet = dialog.querySelector('.sheet');
  const header = document.querySelector('.site-header');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const column = window.matchMedia('(max-width: 599px)');

  const IMAGES = 'assets/img/studio/';
  const W = 1240;
  const MARGIN = 20;          // the screen edge (or header) to the sheet
  const CLOSE_TOP = 18;       // the × from the top
  const LIFT = 150;
  const MOVE = 400;
  const FADE_IN = 200;
  const FADE_OUT = 150;
  const STEPS = 36;           // keyframes per movement (for the counter-scale)
  // Artwork sheets (screen px)
  const ART_INSET = 12;       // outer edge to inside the inner frame (1 + 10 + 1)
  const ART_PAD = 48;         // inside the inner frame
  const ART_GAP = 48;         // artwork to text
  const ART_TEXT = 300;       // text column width
  const ART_EDGE = ART_INSET + ART_PAD;

  let state = 'closed';       // closed | opening | open | closing
  let opener = null;          // the strip box that opened it
  let data = null;            // its SHEETS entry
  let k = 1;                  // the sheet's scale
  let marginTop = 0;          // the sheet's top in the scroll area
  let path = null;            // the movement now running
  let moves = [];             // its two animations (cover box, image)
  let rest, slot, cover, coverImage, closeButton;

  // cubic-bezier(.2, .8, .2, 1), as a function of time 0–1
  const ease = (() => {
    const x1 = .2, y1 = .8, x2 = .2, y2 = 1;
    const curve = (s, a, b) => 3 * a * s * (1 - s) * (1 - s) + 3 * b * s * s * (1 - s) + s * s * s;
    return t => {
      let lo = 0, hi = 1, s = t;
      for (let i = 0; i < 24; i++) {
        if (curve(s, x1, x2) < t) lo = s; else hi = s;
        s = (lo + hi) / 2;
      }
      return curve(s, y1, y2);
    };
  })();

  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  };

  // Position variables (--l, --t, --r, --b, --w, --h) from a SHEETS box
  function place(node, box) {
    const names = { left: '--l', top: '--t', right: '--r', bottom: '--b', width: '--w', height: '--h' };
    for (const key in names) {
      if (box[key] !== undefined) node.style.setProperty(names[key], box[key] + 'px');
    }
  }

  // An artwork sheet's entry, from its frame on the wall
  function artEntry(frame) {
    const img = frame.querySelector('img');
    return {
      art: true,
      title: frame.dataset.title || '',
      note: frame.dataset.note || '',
      src: img ? img.currentSrc || img.src : '',
      alt: img ? img.alt : ''
    };
  }

  function closeButtonFor() {
    const button = el('button', 'sheet-close', '×');
    button.type = 'button';
    button.setAttribute('aria-label', 'Close');
    button.addEventListener('click', close);
    return button;
  }

  // Artwork sheet: the × , the artwork's slot and the text column
  function buildArt(entry) {
    sheet.replaceChildren();
    sheet.classList.add('sheet--art');
    sheet.style.removeProperty('--sheet-h');
    dialog.setAttribute('aria-label', entry.title);

    rest = el('div', 'sheet-rest');
    closeButton = closeButtonFor();
    slot = el('div', 'sheet-slot');
    const text = el('div', 'sheet-text art-sheet-text');
    text.append(el('h2', 'art-sheet-title', entry.title), el('p', 'art-sheet-note', entry.note));
    rest.append(closeButton, slot, text);

    cover = el('div', 'sheet-cover');
    coverImage = el('img');
    coverImage.src = entry.src;
    coverImage.alt = entry.alt;
    cover.append(coverImage);

    sheet.append(rest, cover);
  }

  // Build the sheet from its SHEETS entry
  function build(entry) {
    if (entry.art) return buildArt(entry);
    sheet.replaceChildren();
    sheet.classList.remove('sheet--art');
    sheet.style.width = '';
    sheet.style.height = '';
    sheet.style.setProperty('--sheet-h', entry.height + 'px');
    dialog.setAttribute('aria-label', entry.title);

    rest = el('div', 'sheet-rest');
    closeButton = closeButtonFor();

    const text = el('div', 'sheet-text');
    // No subtitle: no line, the text sits 24px under the title
    text.append(el('h2', 'sheet-title', entry.title));
    if (entry.subtitle) text.append(el('p', 'sheet-issue', entry.subtitle));
    text.append(el('p', 'sheet-body', entry.text));
    place(text, entry.textBox);

    const titleBlock = el('div', 'sheet-titleblock');
    [['Project', entry.project], ['Role', entry.role]].forEach(([label, value]) => {
      const row = el('p', 'sheet-row');
      row.append(el('span', 'sheet-label', label), value);
      titleBlock.append(row);
    });
    place(titleBlock, entry.titleBox);

    rest.append(closeButton, text, titleBlock);

    entry.images.forEach((image, i) => {
      if (i === 0) {
        slot = el('div', 'sheet-slot');
        place(slot, image);
        rest.append(slot);
        return;
      }
      const img = el('img', 'sheet-img');
      img.src = IMAGES + image.src;
      img.alt = image.alt;
      place(img, image);
      rest.append(img);
    });

    cover = el('div', 'sheet-cover');
    coverImage = el('img');
    coverImage.src = IMAGES + entry.images[0].src;
    coverImage.alt = entry.images[0].alt;
    cover.append(coverImage);

    sheet.append(rest, cover);
  }

  // Scale and place the sheet below the header
  function layout() {
    const vw = dialog.clientWidth;
    const vh = dialog.clientHeight;
    const top = header ? Math.max(0, header.getBoundingClientRect().bottom) : 0;
    const available = vh - top;
    scroller.style.top = top + 'px';

    let width, height;
    const ratio = coverImage.naturalWidth / coverImage.naturalHeight || 4 / 5;
    if (data.art && !column.matches) {
      // Artwork sheet, in screen px: the image as tall as the space
      // allows, the sheet's width from it; narrower if too wide
      k = 1;
      sheet.style.transform = '';
      let imageH = available - 2 * MARGIN - 2 * ART_EDGE;
      let imageW = imageH * ratio;
      const room = vw - 2 * MARGIN - 2 * ART_EDGE - ART_GAP - ART_TEXT;
      if (imageW > room) {
        imageW = room;
        imageH = imageW / ratio;
      }
      width = imageW + 2 * ART_EDGE + ART_GAP + ART_TEXT;
      height = imageH + 2 * ART_EDGE;
      sheet.style.width = width + 'px';
      sheet.style.height = height + 'px';
      // (positions inside the sheet start inside its 1px border)
      const inside = ART_EDGE - 1;
      place(slot, { left: inside, top: inside, width: imageW, height: imageH });
      place(rest.querySelector('.art-sheet-text'), { left: inside + imageW + ART_GAP, top: inside, width: ART_TEXT });
      sizer.style.width = width + 'px';
      sizer.style.height = height + 'px';
    } else if (column.matches) {
      // One column, not scaled: the screen width minus 16px each side
      k = 1;
      sheet.style.transform = '';
      if (data.art) {
        sheet.style.width = '';
        sheet.style.height = '';
        ['--l', '--t', '--w', '--h'].forEach(name => {
          slot.style.removeProperty(name);
          rest.querySelector('.art-sheet-text').style.removeProperty(name);
        });
      }
      width = vw - 32;
      sizer.style.width = width + 'px';
      sizer.style.height = '';
      slot.style.setProperty('--ratio', ratio);
      height = sheet.offsetHeight;
    } else {
      const maxWidth = Math.min(W, vw - 40);
      k = Math.min(maxWidth / W, 1);
      if (data.fit === 'screen') k = Math.min(k, (available - 2 * MARGIN) / data.height);
      width = W * k;
      height = data.height * k;
      sheet.style.transform = `scale(${k})`;
      sizer.style.width = width + 'px';
      sizer.style.height = height + 'px';
    }
    sheet.style.setProperty('--k', k);

    // Fits: centred in the space below the header. Taller (and always
    // in one column, where the images are still loading): 20px from
    // the top and the bottom, and it scrolls.
    const fits = !column.matches && height <= available - 2 * MARGIN + .5;
    marginTop = fits ? Math.max(0, (available - height) / 2) : MARGIN;
    sizer.style.marginTop = marginTop + 'px';
    sizer.style.marginBottom = fits ? '0px' : MARGIN + 'px';
    scroller.style.overflowY = fits ? 'hidden' : 'auto';

    // The cover sits exactly over its slot (measured unrounded, in
    // sheet px)
    const s = slot.getBoundingClientRect();
    const o = sheet.getBoundingClientRect();
    place(cover, { left: (s.left - o.left) / k, top: (s.top - o.top) / k, width: s.width / k, height: s.height / k });
    keepClose();
  }

  // The × stays in view while the sheet scrolls
  function keepClose() {
    if (!closeButton) return;
    const onScreen = marginTop + CLOSE_TOP * k - scroller.scrollTop;
    const shift = Math.max(0, CLOSE_TOP - onScreen);
    closeButton.style.transform = shift ? `translateY(${shift / k}px)` : '';
  }

  // The cover's box on the wall, as a move from its slot (translate in
  // sheet px, turn in deg, scale x and y). tilted: where the box's
  // image is now (tilt and any hover lift included); otherwise
  // straight, lifted by px and grown.
  function onWall(lift = 0, grow = 1, tilted = true) {
    const from = tilted ? poseOf(opener) : straightOf(opener);
    const to = slot.getBoundingClientRect();
    return {
      tx: (from.cx - (to.left + to.width / 2)) / k,
      ty: (from.cy - (to.top + to.height / 2) + lift) / k,
      r: from.turn,
      sx: from.w / to.width * grow,
      sy: from.h / to.height * grow
    };
  }
  const HOME = { tx: 0, ty: 0, r: 0, sx: 1, sy: 1 };

  // A path is a list of legs: { from, to, duration }
  function at(legs, time) {
    for (const leg of legs) {
      if (time <= leg.duration) {
        const p = ease(Math.max(0, time) / leg.duration);
        const mix = key => leg.from[key] + (leg.to[key] - leg.from[key]) * p;
        return { tx: mix('tx'), ty: mix('ty'), r: mix('r'), sx: mix('sx'), sy: mix('sy') };
      }
      time -= leg.duration;
    }
    return legs[legs.length - 1].to;
  }

  function run(legs) {
    const total = legs.reduce((sum, leg) => sum + leg.duration, 0);
    const outer = [];
    const inner = [];
    for (let i = 0; i <= STEPS; i++) {
      const v = at(legs, total * i / STEPS);
      const u = Math.max(v.sx, v.sy);   // even scale that covers the box
      outer.push({ transform: `translate(${v.tx}px, ${v.ty}px) rotate(${v.r}deg) scale(${v.sx}, ${v.sy})` });
      inner.push({ transform: `scale(${u / v.sx}, ${u / v.sy})` });
    }
    path = { legs, total };
    const options = { duration: total, fill: 'both' };
    moves = [cover.animate(outer, options), coverImage.animate(inner, options)];
    return moves[0].finished;
  }

  // Where the cover is right now (it may be on its way)
  function now() {
    if (!path || !moves.length) return HOME;
    return at(path.legs, moves[0].currentTime || 0);
  }

  function stopMoves() {
    moves.forEach(a => a.cancel());
    moves = [];
    path = null;
  }

  function fade(value, duration) {
    const from = getComputedStyle(rest).opacity;
    rest.getAnimations().forEach(a => a.cancel());
    rest.style.opacity = value;
    return rest.animate([{ opacity: from }, { opacity: value }], { duration, easing: 'ease' })
      .finished.catch(() => {});
  }

  // The page behind doesn't scroll (the scrollbar's space is kept, so
  // nothing moves)
  function lockPage(on) {
    const root = document.documentElement.style;
    root.overflow = on ? 'hidden' : '';
    root.scrollbarGutter = on ? 'stable' : '';
  }

  async function open(box) {
    if (state !== 'closed') return;
    const entry = box.classList.contains('studio-art') ? artEntry(box) : SHEETS[box.dataset.sheet];
    if (!entry) return;
    state = 'opening';
    opener = box;
    data = entry;

    build(entry);
    await coverImage.decode().catch(() => {});

    lockPage(true);
    rest.style.opacity = 0;
    dialog.showModal();
    scroller.scrollTop = 0;
    closeButton.focus();
    layout();

    if (reduceMotion.matches) {
      opener.classList.add('is-lifted');
      rest.style.opacity = 1;
      state = 'open';
      return;
    }

    const done = run([
      { from: onWall(), to: onWall(-6, 1.03, false), duration: LIFT },
      { from: onWall(-6, 1.03, false), to: HOME, duration: MOVE }
    ]);
    opener.classList.add('is-lifted');
    try {
      await done;
    } catch (e) {
      return; // closed while moving
    }
    if (state !== 'opening') return;
    state = 'open';
    stopMoves();
    fade(1, FADE_IN);
  }

  async function close() {
    if (state !== 'opening' && state !== 'open') return;
    state = 'closing';

    if (reduceMotion.matches) {
      finish();
      return;
    }

    await fade(0, FADE_OUT);
    if (state !== 'closing') return;

    const from = now();
    stopMoves();
    const done = run([
      { from, to: onWall(-6, 1.03, false), duration: MOVE },
      { from: onWall(-6, 1.03, false), to: onWall(), duration: LIFT }
    ]);
    try {
      await done;
    } catch (e) {
      return;
    }
    finish();
  }

  // Back on the wall: show the box, close the dialog, focus the box
  function finish() {
    if (state === 'closed') return;
    state = 'closed';
    opener.classList.remove('is-lifted');
    if (dialog.open) dialog.close();
    stopMoves();
    rest.getAnimations().forEach(a => a.cancel());
    rest.style.opacity = '';
    lockPage(false);
    opener.focus();
  }

  openers.forEach(box => box.addEventListener('click', () => open(box)));

  dialog.addEventListener('cancel', event => {
    event.preventDefault();
    close();
  });

  // Anywhere outside the sheet closes it
  dialog.addEventListener('click', event => {
    if (!sheet.contains(event.target)) close();
  });

  dialog.addEventListener('close', finish);

  scroller.addEventListener('scroll', keepClose, { passive: true });

  window.addEventListener('resize', () => {
    if (state === 'open') layout();
  });
})();
