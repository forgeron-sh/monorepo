import type { PixelIcon } from "../types";

// House with a solid roof in the secondary tone, walls and a solid door.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "home-02",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....oo",
    "....oooo",
    "...oooooo",
    "..oooooooo",
    ".oooooooooo",
    "..#......#",
    "..#......#",
    "..#..##..#",
    "..#..##..#",
    "..########",
  ],
};

export default icon;
