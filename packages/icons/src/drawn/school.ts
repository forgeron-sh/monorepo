import type { PixelIcon } from "../types";

// School: a pediment with a clock in the secondary tone, two slit windows, a central door.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "school",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##",
    "...##..##",
    ".##..oo..##",
    ".##########",
    ".#........#",
    ".#.#.##.#.#",
    ".#.#.##.#.#",
    ".#...##...#",
    ".#...##...#",
    ".##########",
  ],
};

export default icon;
