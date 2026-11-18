import type { PixelIcon } from "../types";

// The Adobe Photoshop mark in pixels: the letters “Ps” cut out of a rounded square.
// 12×12: `#` primary tone. Rasterised from `simple-icons:adobephotoshop` (Iconify, 2026-11-18), then redrawn by hand. Drawn on 2026-11-18.
// Adobe Photoshop and the Adobe Photoshop logo are trademarks of Adobe Inc., used here only to refer to Adobe Photoshop.
const icon: PixelIcon = {
  name: "adobe-photoshop",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".##########",
    "############",
    "############",
    "############",
    "##..###..###",
    "##.#.#.#####",
    "##..###.####",
    "##.#####.###",
    "##.###..####",
    "############",
    "############",
    ".##########",
  ],
};

export default icon;
