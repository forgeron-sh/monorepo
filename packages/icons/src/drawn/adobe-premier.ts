import type { PixelIcon } from "../types";

// The Adobe Premiere Pro mark in pixels: the letters “Pr” cut out of a rounded square.
// 12×12: `#` primary tone. Rasterised from `simple-icons:adobepremierepro` (Iconify, 2026-11-18), then redrawn by hand. Drawn on 2026-11-18.
// Adobe Premiere Pro and the Adobe Premiere Pro logo are trademarks of Adobe Inc., used here only to refer to Adobe Premiere Pro.
const icon: PixelIcon = {
  name: "adobe-premier",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".##########",
    "############",
    "############",
    "############",
    "##..########",
    "##.#.#.#.###",
    "##..##..####",
    "##.###.#####",
    "##.###.#####",
    "############",
    "############",
    ".##########",
  ],
};

export default icon;
