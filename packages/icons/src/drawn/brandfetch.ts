import type { PixelIcon } from "../types";

// The Brandfetch mark in pixels: a slanted “B” whose top stroke curls out to the left.
// 12×12: `#` primary tone. Rasterised from `simple-icons:brandfetch` (Iconify, 2026-11-18), then redrawn by hand. Drawn on 2026-11-18.
// Brandfetch and the Brandfetch logo are trademarks of Brandfetch GmbH, used here only to refer to Brandfetch.
const icon: PixelIcon = {
  name: "brandfetch",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "...#######",
    ".####....##",
    "##.##.....##",
    "...##.....##",
    "...##....##",
    "...##.####",
    "...##...##",
    "...##....##",
    "...##....##",
    "...##...##",
    "..######",
    "..#",
  ],
};

export default icon;
