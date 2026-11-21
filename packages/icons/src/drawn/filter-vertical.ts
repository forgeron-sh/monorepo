import type { PixelIcon } from "../types";

// Three vertical sliders.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "filter-vertical",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..o..#...#",
    "..o..#..ooo",
    "..o..#...#",
    "..o..#...#",
    "..o.ooo..#",
    "..o..#...#",
    ".ooo.#...#",
    "..o..#...#",
    "..o..#...#",
    "..o..#...#",
  ],
};

export default icon;
