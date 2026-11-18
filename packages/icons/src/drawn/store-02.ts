import type { PixelIcon } from "../types";

// Shop front, second style: a sign board in the secondary tone over a shop with a window and a
// door.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "store-02",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#.oooooo.#",
    ".##########",
    "..#......#",
    "..#.##...#",
    "..#.##.###",
    "..#....#.#",
    "..#....#.#",
    "..#....#.#",
    ".##########",
  ],
};

export default icon;
