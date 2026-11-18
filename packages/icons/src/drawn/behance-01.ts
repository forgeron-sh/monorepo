import type { PixelIcon } from "../types";

// The Behance mark in pixels: the letters “Bē”, the B in bold and the e under its macron.
// 12×12: `#` primary tone. Rasterised from `simple-icons:behance` (Iconify, 2026-11-18), then redrawn by hand. Drawn on 2026-11-18.
// Behance and the Behance logo are trademarks of Adobe Inc., used here only to refer to Behance.
const icon: PixelIcon = {
  name: "behance-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    "#####..#####",
    "##..##",
    "#####...###",
    "##..##.#####",
    "##..##.#",
    "#####...####",
  ],
};

export default icon;
