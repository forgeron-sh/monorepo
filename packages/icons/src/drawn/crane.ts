import type { PixelIcon } from "../types";

// Tower crane: a mast, a long jib with a short counter-jib, a hook line and a load in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "crane",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "...#",
    "############",
    "...#.....#",
    "...#.....#",
    "...#....ooo",
    "...#....ooo",
    "...#",
    "...#",
    "...#",
    "...#",
    ".#####",
  ],
};

export default icon;
