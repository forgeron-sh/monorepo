import type { PixelIcon } from "../types";

// Send to mobile: an arrow in the secondary tone pointing into a phone on the right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "send-to-mobile-02",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "......#####",
    "......#...#",
    "......#...#",
    "...o..#...#",
    "ooooo.#...#",
    "...o..#...#",
    "......#...#",
    "......#...#",
    "......#...#",
    "......#####",
  ],
};

export default icon;
