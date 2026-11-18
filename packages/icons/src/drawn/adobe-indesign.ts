import type { PixelIcon } from "../types";

// The Adobe InDesign mark in pixels: the letters “Id” cut out of a rounded square.
// 12×12: `#` primary tone. Rasterised from `simple-icons:adobeindesign` (Iconify, 2026-11-18), then redrawn by hand. Drawn on 2026-11-18.
// Adobe InDesign and the Adobe InDesign logo are trademarks of Adobe Inc., used here only to refer to Adobe InDesign.
const icon: PixelIcon = {
  name: "adobe-indesign",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".##########",
    "############",
    "############",
    "############",
    "###.###.####",
    "###.###.####",
    "###.#...####",
    "###.#.#.####",
    "###.#...####",
    "############",
    "############",
    ".##########",
  ],
};

export default icon;
