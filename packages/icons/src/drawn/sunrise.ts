import type { PixelIcon } from "../types";

// Sunrise: a solid arrow up in the secondary tone over half a sun on the horizon, two short rays.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "sunrise",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....oo",
    "....oooo",
    "...oooooo",
    ".....oo",
    "",
    "....####",
    "##.#....#.##",
    "..#......#",
    "############",
  ],
};

export default icon;
