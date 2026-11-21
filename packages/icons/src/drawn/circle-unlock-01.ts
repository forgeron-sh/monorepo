import type { PixelIcon } from "../types";

// The round lock of `circle-lock-01` with its shackle raised and open on the right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "circle-unlock-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....####",
    "...#....#",
    "...#",
    "...#",
    "...######",
    "..#......#",
    "..#..oo..#",
    "..#..oo..#",
    "..#......#",
    "...#....#",
    "....####",
  ],
};

export default icon;
