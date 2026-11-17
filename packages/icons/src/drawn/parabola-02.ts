import type { PixelIcon } from "../types";

// Downward parabola in the secondary tone over two axes: `parabola-01` turned over.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "parabola-02",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "#",
    "#....ooo",
    "#...o...o",
    "#..o.....o",
    "#..o.....o",
    "#.o.......o",
    "#.o.......o",
    "#.o.......o",
    "#.o.......o",
    "############",
  ],
};

export default icon;
