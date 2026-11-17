import type { PixelIcon } from "../types";

// Radical sign: a short tick, a long stroke rising at 1:2 and the bar over the radicand.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "radical",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".......#####",
    "......#",
    "......#",
    ".....#",
    ".....#",
    "....#",
    "##..#",
    "..##",
    "...#",
  ],
};

export default icon;
