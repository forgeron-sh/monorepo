import type { PixelIcon } from "../types";

// Spline chart: axes and a smooth curve that dips and then climbs, in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "chart-spline",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".#",
    ".#",
    ".#.........o",
    ".#........o",
    ".#...oo...o",
    ".#..o..o.o",
    ".#.o....o",
    ".#.o",
    ".#",
    ".##########",
  ],
};

export default icon;
