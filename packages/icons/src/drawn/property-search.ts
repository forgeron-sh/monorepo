import type { PixelIcon } from "../types";

// Property sheet of `property-new` with a magnifier badge in the shared lower-right corner.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "property-search",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#........#",
    ".##########",
    ".#........#",
    ".#.#......#",
    ".#....ooo.#",
    ".#....o.o.#",
    ".#.#..ooo",
    ".#.......o",
    "..######..o",
  ],
};

export default icon;
