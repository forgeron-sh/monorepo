import type { PixelIcon } from "../types";

// Pipeline: a pipe elbow, flanges at both ends in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "pipeline",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "o",
    "o#######",
    "o.......#",
    "o........#",
    "o######..#",
    "o.....#..#",
    "......#..#",
    "......#..#",
    ".....oooooo",
  ],
};

export default icon;
