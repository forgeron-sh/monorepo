import type { PixelIcon } from "../types";

// Projector: a wide box with a round lens in the secondary tone and two feet.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "projector",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    "############",
    "#..oo......#",
    "#.o..o..##.#",
    "#.o..o.....#",
    "#..oo......#",
    "############",
    ".#........#",
  ],
};

export default icon;
