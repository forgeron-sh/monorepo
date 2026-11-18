import type { PixelIcon } from "../types";

// Two clouds: the front one lower left, the one behind it in the secondary tone, hidden by the front one and a one-pixel clearance.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "cloudy",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".......ooo",
    "......o...o",
    "....ooo....o",
    "...........o",
    "....###....o",
    "...#...#..o",
    ".###....#",
    "#........#",
    "#........#",
    ".########",
  ],
};

export default icon;
