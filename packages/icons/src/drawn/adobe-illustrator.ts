import type { PixelIcon } from "../types";

// The Adobe Illustrator mark in pixels: the letters “Ai” cut out of a rounded square.
// 12×12: `#` primary tone. Rasterised from `simple-icons:adobeillustrator` (Iconify, 2026-11-18), then redrawn by hand. Drawn on 2026-11-18.
// Adobe Illustrator and the Adobe Illustrator logo are trademarks of Adobe Inc., used here only to refer to Adobe Illustrator.
const icon: PixelIcon = {
  name: "adobe-illustrator",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".##########",
    "############",
    "############",
    "############",
    "####.##.####",
    "###.#.######",
    "###...#.####",
    "###.#.#.####",
    "###.#.#.####",
    "############",
    "############",
    ".##########",
  ],
};

export default icon;
