import type { PixelIcon } from "../types";

// The Apple Music mark in pixels: a beamed pair of notes cut out of a rounded square.
// 12×12: `#` primary tone. Rasterised from `simple-icons:applemusic` (Iconify, 2026-11-18), then redrawn by hand. Drawn on 2026-11-18.
// Apple Music and the Apple Music logo are trademarks of Apple Inc., used here only to refer to Apple Music.
const icon: PixelIcon = {
  name: "apple-music",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".##########",
    "############",
    "#######...##",
    "#####.....##",
    "#####.###.##",
    "#####.###.##",
    "#####.###.##",
    "#####.#...##",
    "###...#...##",
    "###...######",
    "############",
    ".##########",
  ],
};

export default icon;
