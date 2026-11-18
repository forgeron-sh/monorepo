import type { PixelIcon } from "../types";

// Wristwatch: a strap above and below, a case, the hands in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "watch-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....####",
    "....####",
    "...######",
    "..#......#",
    "..#..o...#",
    "..#..oo..#",
    "..#......#",
    "...######",
    "....####",
    "....####",
  ],
};

export default icon;
