import type { PixelIcon } from "../types";

// The Bebo mark in pixels: a rounded lowercase “b”.
// 12×12: `#` primary tone. Drawn on 2026-11-18.
// Bebo and the Bebo logo are trademarks of Bebo, Inc., used here only to refer to Bebo.
const icon: PixelIcon = {
  name: "bebo",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..##",
    "..##",
    "..##",
    "..##.####",
    "..###...##",
    "..##.....##",
    "..##.....##",
    "..##.....##",
    "..###...##",
    "...######",
  ],
};

export default icon;
