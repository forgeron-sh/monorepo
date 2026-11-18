import type { PixelIcon } from "../types";

// Pickup truck seen from the side: a cab with a sloped windscreen at the front and an open bed behind, on two wheels.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "pickup-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".....####",
    ".....#..##",
    "#....#...##",
    "############",
    "#..........#",
    "############",
    ".###....###",
    ".###....###",
  ],
};

export default icon;
