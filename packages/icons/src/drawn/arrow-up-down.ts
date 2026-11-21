import type { PixelIcon } from "../types";

// Sort: an arrow up and an arrow down side by side, symmetric by a half turn, so centred exactly.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "arrow-up-down",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...#....#",
    "..###...#",
    ".#.#.#..#",
    "...#....#",
    "...#....#",
    "...#....#",
    "...#....#",
    "...#..#.#.#",
    "...#...###",
    "...#....#",
  ],
};

export default icon;
