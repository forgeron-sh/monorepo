import type { PixelIcon } from "../types";

// Parabola in the secondary tone over two axes.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "parabola-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "#.o.......o",
    "#.o.......o",
    "#.o.......o",
    "#..o.....o",
    "#..o.....o",
    "#...o...o",
    "#....ooo",
    "#",
    "#",
    "############",
  ],
};

export default icon;
