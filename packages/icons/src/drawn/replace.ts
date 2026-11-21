import type { PixelIcon } from "../types";

// Replace: two squares swapping places, two arrows in the secondary tone; half-turn symmetric.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "replace",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".####",
    ".#..#.oooo",
    ".#..#....o",
    ".####...ooo",
    ".........o",
    "..o",
    ".ooo...####",
    "..o....#..#",
    "..oooo.#..#",
    ".......####",
  ],
};

export default icon;
