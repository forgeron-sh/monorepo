import type { PixelIcon } from "../types";

// A person in front with two smaller people behind on each side in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "user-group-02",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".oo..##..oo",
    ".oo.#..#.oo",
    "....#..#",
    "ooo..##..ooo",
    "",
    "...######",
    "..#......#",
    ".#........#",
    ".#........#",
    ".##########",
  ],
};

export default icon;
