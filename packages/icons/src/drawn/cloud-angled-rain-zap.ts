import type { PixelIcon } from "../types";

// Storm: the cloud and bolt of `cloud-angled-zap` with slanted rain on both sides.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "cloud-angled-rain-zap",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....###",
    "...##...#",
    "..#......#",
    ".#........#",
    ".#....oo..#",
    "..###oo.##",
    "....oooo",
    "..#..oo...#",
    ".#..oo...#",
    "#...o...#",
  ],
};

export default icon;
