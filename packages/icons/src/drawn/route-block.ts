import type { PixelIcon } from "../types";

// The `route-01` path ending on a cross in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "route-block",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".###",
    ".#.#",
    ".###",
    "..#",
    "..#....###",
    "...###....#",
    ".........#",
    "........o.o",
    ".........o",
    "........o.o",
  ],
};

export default icon;
