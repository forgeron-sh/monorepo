import type { PixelIcon } from "../types";

// The sun and cloud of the set with slanted rain and a lightning bolt.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "sun-cloud-angled-rain-zap-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "..ooo",
    ".ooooo",
    ".ooooo",
    ".ooo..###",
    "....##...#",
    "...#......#",
    "...#......#",
    "....######",
    "........o",
    "....#.ooo..#",
    "...#..o...#",
    ".....o",
  ],
};

export default icon;
