import type { PixelIcon } from "../types";

// Sunset: `sunrise` with the arrow pointing down.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "sunset",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....oo",
    "...oooooo",
    "....oooo",
    ".....oo",
    "",
    "....####",
    "##.#....#.##",
    "..#......#",
    "############",
  ],
};

export default icon;
