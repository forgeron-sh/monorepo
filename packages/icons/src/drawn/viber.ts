import type { PixelIcon } from "../types";

// The Viber mark: a rounded speech bubble with a tail and a phone handset inside.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "viber",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "...#####",
    ".##.....##",
    "#.........#",
    "#..oo.....#",
    "#..oo.....#",
    "#...o.....#",
    "#....o.oo.#",
    "#.....ooo.#",
    ".#.......#",
    ".#.######",
    ".##",
  ],
};

export default icon;
