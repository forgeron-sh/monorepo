import type { PixelIcon } from "../types";

// Aspect ratio: a portrait frame in the secondary tone inside a landscape one.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "ratio",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "############",
    "#..........#",
    "#...oooo...#",
    "#...o..o...#",
    "#...o..o...#",
    "#...o..o...#",
    "#...o..o...#",
    "#...oooo...#",
    "#..........#",
    "############",
  ],
};

export default icon;
