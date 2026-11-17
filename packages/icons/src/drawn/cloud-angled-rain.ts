import type { PixelIcon } from "../types";

// Cloud with three slanted rain streaks in the secondary tone, the cloud of `rain`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "cloud-angled-rain",
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
    "....o..o..o",
    "...o..o..o",
    "..o..o..o",
  ],
};

export default icon;
