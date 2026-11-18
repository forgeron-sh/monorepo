import type { PixelIcon } from "../types";

// Graphics card: a board with a round fan in the secondary tone and its connector.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "gpu",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "############",
    "#....oo....#",
    "#...o..o...#",
    "#..o....o..#",
    "#..o....o..#",
    "#...o..o...#",
    "#....oo....#",
    "############",
    "...######",
  ],
};

export default icon;
