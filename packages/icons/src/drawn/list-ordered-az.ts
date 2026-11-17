import type { PixelIcon } from "../types";

// Letters A and Z with a down arrow: sort from A to Z.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "list-ordered-az",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".oo.....#",
    "o..o....#",
    "oooo....#",
    "o..o....#",
    "........#",
    "oooo....#",
    "..o...#.#.#",
    ".o.....###",
    "oooo....#",
  ],
};

export default icon;
