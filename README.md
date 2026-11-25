# Merve Uzuner, Portfolio

My UX/UI design portfolio: a one-page homepage (landing, Work, My story, Education, Skills, How I work with AI) plus case study pages. Plain HTML, CSS and vanilla JavaScript: no frameworks, no build step.

## How to run

- **Locally:** double-click `index.html`, or open it from your browser (File → Open). That's it.
- **Live preview while editing (optional):** use the VS Code "Live Server" extension and click "Go Live".
- **GitHub Pages:** push the folder to a repository, then go to Settings → Pages → Deploy from branch → `main` / root. All paths are relative, so it works as is.

Fonts (Geist and Instrument Sans) load from Google Fonts, so you need an internet connection to see them. Offline, the page falls back to system fonts.

## Files

```
index.html               the homepage
work/dreamlab.html       the Dreamlab case study
work/waitwell.html       the WaitWell case study (several sections are headings only for now)
studio.html              the Studio page: a hand-drawn studio with the wall images on top
assets/css/case.css      patterns shared by the case study pages
assets/js/reveal.js      scroll reveal on the case study pages
assets/css/base.css      reset, design tokens (colours, fonts, gutter, side menu width), shared text styles
assets/css/layout.css    shared parts (header, side menu, footer) + homepage sections
assets/css/work.css      the homepage's Work section: project rows, lines, hover peek
assets/css/cv.css        the homepage's "View my CV" row and CV sheet
assets/cv/               the CV PDF and its page images (once the real CV is ready)
assets/js/main.js        cover column loop (homepage) + side menu behaviour (both pages) + CV sheet (homepage)
assets/css/studio.css    the Studio stage, wall frames and large view
assets/js/studio.js      Studio: wall frames open large in a <dialog>
assets/img/studio/       studio-bg.svg (the drawing) and, later, the wall images
assets/img/covers/       project cover images
```

## Adding a page that uses the side menu

Put `<div class="side-menu-anchor">` with the `<aside class="side-menu">` inside it where the menu should start (at the top of the Work section on the homepage, right after the header on a case study page). `main.js` pins the menu when that anchor reaches the top of the screen. Mark sections with `data-nav="work|about"` (matching each menu link's `data-nav-link`) and dark sections with `data-dark`.

## How to swap the placeholder covers

WaitWell already uses its final cover, `assets/img/covers/waitwell-cover.jpg` (1200×1500). Dreamlab uses a looping video cover (`assets/video/dreamlab/dreamlab-cover.mp4`). The old SVG placeholders are no longer in the site.

1. Export each real cover at **4:5** (for example 1200×1500 px, so it stays sharp on retina screens).
2. Save them as `.jpg`, named like the WaitWell one: `dreamlab-cover.jpg`, `before-ux-cover.jpg`.
3. Put them in `assets/img/covers/`.
4. In `assets/js/main.js`, update the file extension in the `PROJECTS` array at the top:
   ```js
   image: 'assets/img/covers/before-ux-cover.jpg',
   ```
5. Check the `alt` text in the same array still describes the real image.

The tiles are built from that `PROJECTS` array, so the name, role, image and alt text for each project all live in one place.

**Work section (homepage):** the hover images use the same cover files (`assets/img/covers/`).

## How to add the Studio wall images

The wall frames in `studio.html` are placeholders (hatched boxes). For each one:

1. Put the image in `assets/img/studio/`.
2. In `studio.html`, inside that frame's `<button>`, replace the `<span class="studio-label">…</span>` (or the empty button, for the strip squares) with `<img src="assets/img/studio/your-file.jpg" alt="what the image shows">`.
3. Update the button's `aria-label` (for example "Set design sketch — open large").

Each frame's position and size come from the drawing's pixels (`--x`, `--y`, `--w`, `--h` on the button, on the original 1600 × 900 area, the middle of the 2400 × 900 drawing). The large view copies whatever is inside the button, so it shows the same image. On desktop the drawing fills the screen below the header at full height; the blank paper and lines at the sides are cropped. Below 960 px wide the stage is 960 px wide and scrolls sideways.

## CV

The homepage's "View my CV" button (`id="cv"`, after the Skills row) opens the CV sheet. The footer CV links open it too: `#cv` on the homepage, `index.html#cv` (or `../index.html#cv`) on the other pages, which scrolls to the button and opens the sheet straight away.

The sheet shows `assets/cv/merve-uzuner-cv.pdf` as images, one PNG per page, and the "Download PDF" link downloads the PDF itself. To update the CV:

1. Replace `assets/cv/merve-uzuner-cv.pdf` (keep the name).
2. Convert each page to a PNG 1700 px wide (twice A4 at 850 px, so it stays sharp on retina screens): `cv-page-1.png`, `cv-page-2.png`… in the same folder. Also make `cv-peek.png` from page 1 at 312 px wide (the 156 × 220 hover peek at 2×). Any PDF-to-PNG tool that renders at that width (rather than enlarging a small image) will do.
3. In `assets/js/main.js`, section 7, list one image per page in `CV_PAGES`:
   ```js
   const CV_PAGES = [
     'assets/cv/cv-page-1.png',
     'assets/cv/cv-page-2.png'
   ];
   ```
   The alt text ("CV, page 1 of 2"…) comes from this list.

## How the cover column works (short version)

- The three projects are repeated 3 times (9 tiles). The page starts on tile 4, the first tile of the middle copy.
- Every 3.2 s it scrolls one tile down. It pauses while the mouse is over the column, while the column has keyboard focus, and for 4 s after you scroll it yourself.
- When scrolling stops in the first or last copy, the script jumps instantly to the same tile in the middle copy. The image and position are identical, so you never see the jump. Transitions are switched off for that one frame.
- Every tile has the same layout size and is never transformed; the active / inactive look is an opacity and a scale on the image or video inside it. That keeps each tile's snap point fixed. Tile positions and the jump distance are read from the real layout (`offsetTop`), and scroll snapping is switched off while the script scrolls, then back on when the scroll has ended.
- With "reduce motion" turned on in the OS, there's no auto-advance and all scrolling is instant.
- From 1100 px wide (two-column hero), the centre tile is exactly as tall as the headline: `main.js` measures from the top of the capitals in the first line to the baseline of the last line, and sets the tile height (width stays 4:5), the gap and the column's position as CSS variables on `.covers`. It measures again on resize and when the fonts load. The tiles above and below are scaled to .78. Below 1100 px the sizes come from the CSS alone.

## How the side menu works (desktop, 900 px and wider)

- Its main items are Work, Studio, About and Contact. While About is the current item, a sub-list appears under them (My story, What I bring, Education, Skills, How I work with AI), and the sub-item whose section is at the middle of the screen is blue. It starts at the top of the Work section and scrolls up with it. When it reaches the top of the screen it becomes `position: fixed` and stays there to the bottom of the page.
- While it's pinned, the header nav is hidden.
- An IntersectionObserver turns it white over the blue band and the black footer.
- The current section's item is blue (white and underlined on dark backgrounds).
- Below 900 px there is no side menu. The header is sticky instead.

## TODO

- Real email address (footer link text and both `mailto:` links, on both pages)
- LinkedIn URL (footer, both pages)
- WaitWell case study (`work/waitwell.html`): hero subtitle; content for Design process, Development and Final product
- Real cover images (see above)
