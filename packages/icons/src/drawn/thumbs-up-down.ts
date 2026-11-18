import type { PixelIcon } from "../types";

// Thumbs up and down: a small `thumbs-up` top left and a small `thumbs-down` bottom right, cuffs outside.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "thumbs-up-down",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "..#",
    "..#",
    "..####",
    "#.###",
    "#.####",
    "#.###",
    ".......###.#",
    "......####.#",
    ".......###.#",
    "......####",
    ".........#",
    ".........#",
  ],
};

export default icon;
