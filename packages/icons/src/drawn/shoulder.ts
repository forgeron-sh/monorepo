import type { PixelIcon } from "../types";

// Shoulder: the person of `user`, one shoulder in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "shoulder",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....####",
    "...#....#",
    "...#....#",
    "...#....#",
    "....####",
    "",
    "...###ooo",
    "..#......o",
    ".#........o",
    ".######oooo",
  ],
};

export default icon;
