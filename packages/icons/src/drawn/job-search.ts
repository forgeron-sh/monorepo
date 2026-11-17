import type { PixelIcon } from "../types";

// Job search: the briefcase of `briefcase-01` with a magnifying glass badge in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "job-search",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....####",
    "....#..#",
    ".##########",
    ".#........#",
    ".#........#",
    ".#",
    ".#....ooo",
    ".#....o.o",
    ".#....ooo",
    ".####....o",
    "..........o",
  ],
};

export default icon;
