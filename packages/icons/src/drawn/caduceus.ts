import type { PixelIcon } from "../types";

// Caduceus: a staff with spread wings at the top and two snakes in the secondary tone winding around it.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "caduceus",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".....##",
    "###..##..###",
    ".###.##.###",
    "...o.##.o",
    "....o##o",
    "....o##o",
    "...o.##.o",
    "...o.##.o",
    "....o##o",
    "....o##o",
    "...o.##.o",
    ".....##",
  ],
};

export default icon;
