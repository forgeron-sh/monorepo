import type { PixelIcon } from "../types";

// Horse (the horse drawing) with a saddle on its back in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "horse-saddle",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".........##",
    "........####",
    ".......##..#",
    "..o..o.##",
    ".#oooo###",
    "#########",
    "#.#######",
    "..##..##",
    "..#....#",
    "..#....#",
  ],
};

export default icon;
