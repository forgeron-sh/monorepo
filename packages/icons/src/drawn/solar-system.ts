import type { PixelIcon } from "../types";

// Solar system: a sun in the secondary tone inside an orbit carrying a solid planet.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "solar-system",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....####",
    "..##....###",
    ".#......###",
    ".#......###",
    "#....oo....#",
    "#...oooo...#",
    "#...oooo...#",
    "#....oo....#",
    ".#........#",
    ".#........#",
    "..##....##",
    "....####",
  ],
};

export default icon;
