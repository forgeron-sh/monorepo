import type { PixelIcon } from "../types";

// Ligature: the letters f and i joined, the shared hook in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "ligature",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....ooo",
    "....#...o",
    "....#",
    "..#####.#",
    "....#...#",
    "....#...#",
    "....#...#",
    "....#...#",
    "....#...#",
    "...###.###",
  ],
};

export default icon;
