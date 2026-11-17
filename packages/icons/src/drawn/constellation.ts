import type { PixelIcon } from "../types";

// Constellation: four stars in the secondary tone joined by lines.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "constellation",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".........oo",
    ".........oo",
    ".........#",
    ".....oo..#",
    ".....oo##oo",
    "....#....oo",
    "...#",
    ".oo",
    ".oo",
  ],
};

export default icon;
