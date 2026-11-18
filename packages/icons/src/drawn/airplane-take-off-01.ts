import type { PixelIcon } from "../types";

// Take-off: a plane seen from above, nose up and to the right, over the runway.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "airplane-take-off-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".........##",
    "........###",
    "...#...###",
    "...##.###",
    "...######",
    "....####",
    "...####",
    "...##.##",
    "......#",
    "",
    ".##########",
  ],
};

export default icon;
