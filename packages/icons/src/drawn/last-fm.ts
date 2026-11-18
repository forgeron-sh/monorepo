import type { PixelIcon } from "../types";

// The Last.fm mark in pixels: the joined letters a and s of the logo.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "last-fm",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    ".####..###",
    "#...#.#...#",
    "#...#.#",
    "#...#..###",
    "#...#.....#",
    "#...#.#...#",
    ".####..###",
  ],
};

export default icon;
