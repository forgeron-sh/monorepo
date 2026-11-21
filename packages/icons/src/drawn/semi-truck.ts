import type { PixelIcon } from "../types";

// Semi truck: a long trailer coupled to a cab with a sloped windscreen, three pairs of wheels in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "semi-truck",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "#######",
    "#.....#",
    "#.....#.##",
    "#.....#.#.#",
    "#.....#.#..#",
    "############",
    ".oo..oo..oo",
    ".oo..oo..oo",
  ],
};

export default icon;
