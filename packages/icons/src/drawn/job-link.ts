import type { PixelIcon } from "../types";

// Job link: the briefcase of `briefcase-01` with a chain-link badge in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "job-link",
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
    ".#....ooooo",
    ".####...o.o",
    "........ooo",
  ],
};

export default icon;
