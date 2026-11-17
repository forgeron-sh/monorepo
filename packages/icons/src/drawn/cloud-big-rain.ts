import type { PixelIcon } from "../types";

// Cloud of `rain` with three long straight streaks of heavy rain in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "cloud-big-rain",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....###",
    "...##...#",
    "..#......#",
    ".#........#",
    ".#........#",
    "..########",
    "",
    "...o..o..o",
    "...o..o..o",
    "...o..o..o",
  ],
};

export default icon;
