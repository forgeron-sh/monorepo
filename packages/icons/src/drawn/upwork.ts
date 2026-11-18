import type { PixelIcon } from "../types";

// The Upwork mark: the letters u and p joined, the p running below the line.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "upwork",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "#..#",
    "#..#.####",
    "#..#.#...#",
    "#..#.#...#",
    "#..#.#...#",
    ".##..####",
    ".....#",
    ".....#",
    ".....#",
  ],
};

export default icon;
