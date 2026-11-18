import type { PixelIcon } from "../types";

// The Loom mark in pixels: a starburst of rays round an empty centre.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "loom",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".....##",
    ".#...##...#",
    "..#..##..#",
    "...#.##.#",
    "....####",
    "#####..#####",
    "#####..#####",
    "....####",
    "...#.##.#",
    "..#..##..#",
    ".#...##...#",
    ".....##",
  ],
};

export default icon;
