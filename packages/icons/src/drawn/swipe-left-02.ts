import type { PixelIcon } from "../types";

// A touch point with an arrow to the left in the secondary tone: `swipe-right-02` mirrored.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "swipe-left-02",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    "........###",
    ".o.....#...#",
    "oooooo.#...#",
    ".o.....#...#",
    "........###",
  ],
};

export default icon;
