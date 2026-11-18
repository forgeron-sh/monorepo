import type { PixelIcon } from "../types";

// The Adobe After Effects mark in pixels: the letters “Ae” cut out of a rounded square.
// 12×12: `#` primary tone. Rasterised from `simple-icons:adobeaftereffects` (Iconify, 2026-11-18), then redrawn by hand. Drawn on 2026-11-18.
// Adobe After Effects and the Adobe After Effects logo are trademarks of Adobe Inc., used here only to refer to Adobe After Effects.
const icon: PixelIcon = {
  name: "adobe-after-effect",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".##########",
    "############",
    "############",
    "############",
    "###.########",
    "##.#.##.####",
    "##...#...###",
    "##.#.#.#####",
    "##.#.##..###",
    "############",
    "############",
    ".##########",
  ],
};

export default icon;
