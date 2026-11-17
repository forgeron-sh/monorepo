import type { PixelIcon } from "../types";

// Coupon: the ticket of `ticket-01` with a percent sign in the secondary tone, symmetric by a half turn.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "coupon-percent",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "############",
    "#..oo...o..#",
    "#..oo..o...#",
    ".#....o...#",
    ".#...o....#",
    "#...o..oo..#",
    "#..o...oo..#",
    "############",
  ],
};

export default icon;
