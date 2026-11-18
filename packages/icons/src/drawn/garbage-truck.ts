import type { PixelIcon } from "../types";

// Garbage truck: the `truck` base with the ribs of its compactor box.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "garbage-truck",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".#######",
    ".#.#.#.#",
    ".#.#.#.###",
    ".#.#.#.#..#",
    ".#.....#..#",
    ".##########",
    "..oo....oo",
    "..oo....oo",
  ],
};

export default icon;
