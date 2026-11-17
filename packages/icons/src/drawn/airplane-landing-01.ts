import type { PixelIcon } from "../types";

// Landing: a plane seen from above, nose down and to the right, over the runway.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "airplane-landing-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "...##.###",
    "...#####",
    "....###",
    "..######",
    "...#.####",
    "......####",
    "........###",
    "",
    ".##########",
  ],
};

export default icon;
