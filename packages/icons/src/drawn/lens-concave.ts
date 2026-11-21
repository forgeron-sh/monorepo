import type { PixelIcon } from "../types";

// Concave lens: flat ends and sides curving in to a narrow waist.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "lens-concave",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    "...#....#",
    "...#....#",
    "....#..#",
    "....#..#",
    "....#..#",
    "....#..#",
    "...#....#",
    "...#....#",
    "..########",
  ],
};

export default icon;
