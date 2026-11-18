import type { PixelIcon } from "../types";

// Closed eye: the lower lid of `eye` as an arc, with four lashes.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "eye-closed",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    "",
    "#..........#",
    ".##......##",
    "...######",
    "..#.#..#.#",
    ".#..#..#..#",
  ],
};

export default icon;
