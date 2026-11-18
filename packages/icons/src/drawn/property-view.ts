import type { PixelIcon } from "../types";

// Property sheet of `property-new` with an eye badge in the shared lower-right corner.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "property-view",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#........#",
    ".##########",
    ".#........#",
    ".#.#.####.#",
    ".#",
    ".#.....ooo",
    ".#.#..o.o.o",
    ".#.....ooo",
    "..####",
  ],
};

export default icon;
