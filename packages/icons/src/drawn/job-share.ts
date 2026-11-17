import type { PixelIcon } from "../types";

// Job share: the briefcase of `briefcase-01` with a 45° outgoing arrow badge in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "job-share",
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
    ".#......ooo",
    ".#.......oo",
    ".#......o.o",
    ".####..o",
    "......o",
  ],
};

export default icon;
