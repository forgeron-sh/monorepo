import type { PixelIcon } from "../types";

// DNA: two strands crossing in a double helix, three base pairs in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "dna",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "..#......#",
    "...#oooo#",
    "....#..#",
    ".....##",
    "....#..#",
    "...#....#",
    "..#oooooo#",
    "...#....#",
    "....#..#",
    ".....##",
    "....#..#",
    "...#oooo#",
  ],
};

export default icon;
