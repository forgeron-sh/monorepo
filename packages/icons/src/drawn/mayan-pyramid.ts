import type { PixelIcon } from "../types";

// Mayan pyramid: a temple on stepped tiers, the central stair in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "mayan-pyramid",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....####",
    "....#..#",
    "...######",
    "...#.oo.#",
    "..###oo###",
    "..#..oo..#",
    ".####oo####",
    ".#...oo...#",
    "#####oo#####",
    "#....oo....#",
    "#####oo#####",
  ],
};

export default icon;
