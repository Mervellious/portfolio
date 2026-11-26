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
work/waitwell.html       the WaitWell case study
studio.html              the Studio page: a hand-drawn studio with the wall images on top
assets/css/base.css      reset, design tokens (colours, fonts, gutter, side menu width), shared text styles
assets/css/layout.css    shared parts (header, side menu, footer) + homepage sections
assets/css/work.css      the homepage's Work section: project rows, lines, hover peek
assets/css/cv.css        the homepage's "View my CV" row and CV sheet
assets/css/case.css      patterns shared by the case study pages
assets/css/studio.css    the Studio stage, wall frames, work sheets and artwork sheets
assets/js/main.js        cover column (homepage), side menu, hero video, screen strips, CV sheet, Work lines
assets/js/reveal.js      scroll reveal on the case study pages
assets/js/studio.js      Studio: wall items open in a sheet (<dialog>)
assets/cv/               the CV PDF and its page images
assets/img/covers/       the WaitWell cover (homepage column, hover peek, og:image)
assets/img/dreamlab/     Dreamlab case study images
assets/img/waitwell/     WaitWell case study images
assets/img/studio/       studio-bg.svg (the drawing), the artworks and the work sheet images
assets/video/dreamlab/   the homepage cover video, the case study hero video and the patient flow video, with posters
assets/video/waitwell/   the WaitWell hero video and its poster
```

## Adding a page that uses the side menu

Put `<div class="side-menu-anchor">` with the `<aside class="side-menu">` inside it where the menu should start (at the top of the Work section on the homepage, right after the header on a case study page). `main.js` pins the menu when that anchor reaches the top of the screen. Mark sections with `data-nav="work|about"` (matching each menu link's `data-nav-link`) and dark sections with `data-dark`.

## Homepage covers

The cover column on the homepage has two projects, both set in the `PROJECTS` array at the top of `assets/js/main.js`: name, role, link, cover and alt text all live there.

- WaitWell uses an image: `assets/img/covers/waitwell-cover.jpg` (4:5, 1200×1500).
- Dreamlab uses a looping video, `assets/video/dreamlab/dreamlab-cover.mp4`, with `dreamlab-cover-poster.jpg` as its poster.

To change a cover, export it at **4:5** (for example 1200×1500 px, so it stays sharp on retina screens) and update its path and `alt` text in `PROJECTS`. A project with `video` (and `poster`) gets a video cover; one with `image` gets an image.

**Work section (homepage):** the hover images are set in `index.html`, one `<img>` in each row's `.row-peek`: `waitwell-cover.jpg` and `dreamlab-cover-poster.jpg`.

## Studio wall items

The wall items in `studio.html` are buttons with an image inside. Each one's position and size come from the drawing's pixels (`--x`, `--y`, `--w`, `--h` on the button, on the original 1600 × 900 area, the middle of the 2400 × 900 drawing), and `--tilt` turns it slightly.

- **Artworks (ART 1–6):** `class="studio-frame studio-art"`. The sheet shows the button's image uncropped, with `data-title` and `data-note` as the handwritten text beside it. Keep the button's `aria-label` and the image's `alt` in line with them.
- **Work boxes (the strip, 1–5):** `class="studio-frame studio-work"` with `data-sheet="elle"` and so on. Each sheet's title, captions and images come from the `SHEETS` object in `assets/js/studio.js`. The images are in `assets/img/studio/` (`work1_cover.jpg`, `work1_a.jpg`…).

On desktop the drawing fills the screen below the header at full height. It is sized so the safe zone, x −170 to 1580 of the drawing, always fits the width; the blank paper and lines beyond it are cropped. Below 960 px wide the stage is 960 px wide and scrolls sideways.

## CV

The homepage's "View my CV" button (`id="cv"`, after the Skills row) opens the CV sheet. The footer CV links open it too: `#cv` on the homepage, `index.html#cv` (or `../index.html#cv`) on the other pages, which scrolls to the button and opens the sheet straight away.

The sheet shows `assets/cv/merve-uzuner-cv.pdf` as images, one PNG per page, and the "Download PDF" link downloads the PDF itself. To update the CV:

1. Replace `assets/cv/merve-uzuner-cv.pdf` (keep the name).
2. Convert each page to a PNG 1700 px wide (twice A4 at 850 px, so it stays sharp on retina screens): `cv-page-1.png`, `cv-page-2.png`… in the same folder. Also make `cv-peek.png` from page 1 at 312 px wide (the 156 × 220 hover peek at 2×). Any PDF-to-PNG tool that renders at that width (rather than enlarging a small image) will do.
3. In `assets/js/main.js`, section 6, list one image per page in `CV_PAGES`:
   ```js
   const CV_PAGES = [
     'assets/cv/cv-page-1.png',
     'assets/cv/cv-page-2.png'
   ];
   ```
   The alt text ("CV, page 1 of 2"…) comes from this list.

## How the cover column works (short version)

- The two projects are repeated 3 times (6 tiles). The page starts on tile 3, the first tile of the middle copy.
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

- Real email address (footer link text and both `mailto:` links, on all four pages)
- Once the site is live: make `og:image` an absolute URL on both case study pages
- Dreamlab: re-export the site map and task flow images, which still say "clinician"
