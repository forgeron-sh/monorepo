import type { PixelIcon } from "../types";

// The Castbox mark in pixels: a sound wave cut out of an upright hexagon.
// 12×12: `#` primary tone. Rasterised from `simple-icons:castbox` (Iconify, 2026-11-18), then redrawn by hand. Drawn on 2026-11-18.
// Castbox and the Castbox logo are trademarks of Guru Network Limited, used here only to refer to Castbox.
const icon: PixelIcon = {
  name: "castbox",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".....##",
    "...######",
    ".##########",
    "############",
    "#####.######",
    "###.#.#.####",
    "###.#.#.#.##",
    "#####.#.####",
    "############",
    ".##########",
    "...######",
    ".....##",
  ],
};

export default icon;
