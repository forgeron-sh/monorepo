import type { PixelIcon } from "../types";

// A screen with two subtitle lines along the bottom in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "subtitle",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".##########",
    ".#........#",
    ".#........#",
    ".#........#",
    ".#........#",
    ".#.oooooo.#",
    ".#........#",
    ".#..oooo..#",
    ".#........#",
    ".##########",
  ],
};

export default icon;
