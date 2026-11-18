import type { PixelIcon } from "../types";

// Briefcase with a check badge: `briefcase-01` cut for the badge, the clasp moved up, the check in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "permanent-job",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....####",
    "....#..#",
    ".##########",
    ".#...##...#",
    ".#...##...#",
    ".#",
    ".#........o",
    ".#.......o",
    ".#....o.o",
    ".####..o",
  ],
};

export default icon;
