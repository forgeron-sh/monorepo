import type { PixelIcon } from "../types";

// A steep slope with snow blocks tumbling down it in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "avalanche",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "#",
    "##..oo",
    "#.#.oo",
    "#..#",
    "#...#..oo",
    "#....#.oo",
    "#.....#",
    "#......#..oo",
    "#.......#.oo",
    "############",
  ],
};

export default icon;
