import type { PixelIcon } from "../types";

// Property sheet of `property-new` with a pencil badge in the shared lower-right corner.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "property-edit",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#........#",
    ".##########",
    ".#........#",
    ".#.#.###",
    ".#.......oo",
    ".#......o.o",
    ".#.#...o.o",
    ".#....o.o",
    "..###.oo",
  ],
};

export default icon;
