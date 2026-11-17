import type { PixelIcon } from "../types";

// A sword: a diagonal blade, a cross guard and a short grip.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "sword-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "..........##",
    ".........##",
    "........##",
    ".......##",
    ".#....##",
    "..#..##",
    "...###",
    "...##",
    "..##.#",
    ".##...#",
    "##",
  ],
};

export default icon;
