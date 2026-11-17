import type { PixelIcon } from "../types";

// Text creation: a letter T inside a frame with square handles, in the secondary tone, at its four corners.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "text-creation",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "oo.######.oo",
    "oo........oo",
    "",
    "#..######..#",
    "#..#.##.#..#",
    "#....##....#",
    "#....##....#",
    "#....##....#",
    "#...####...#",
    "",
    "oo........oo",
    "oo.######.oo",
  ],
};

export default icon;
