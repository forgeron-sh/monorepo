import type { PixelIcon } from "../types";

// The Wikipedia W: a serif W with three wide tops.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "wikipedia",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    "###.###.###",
    ".#...#...#",
    ".#..#.#..#",
    "..#.#.#.#",
    "..#.#.#.#",
    "...#...#",
  ],
};

export default icon;
