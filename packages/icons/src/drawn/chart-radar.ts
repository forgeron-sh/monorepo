import type { PixelIcon } from "../types";

// Radar chart: a diamond frame and the data area inside it in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "chart-radar",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##",
    "....#..#",
    "...#....#",
    "..#..oo..#",
    ".#..oooo..#",
    ".#..ooooo.#",
    "..#..oo..#",
    "...#....#",
    "....#..#",
    ".....##",
  ],
};

export default icon;
