import type { PixelIcon } from "../types";

// Jar: a lid over a bottle-shaped glass jar.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "jar",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "...#....#",
    "...######",
    "..#......#",
    ".#........#",
    ".#........#",
    ".#........#",
    ".#........#",
    ".#........#",
    "..########",
  ],
};

export default icon;
