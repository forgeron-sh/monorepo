import type { PixelIcon } from "../types";

// Programming flag: `flag-01` widened, with angle brackets in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "programming-flag",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..#########",
    "..#..o.o..#",
    "..#.o...o.#",
    "..#..o.o..#",
    "..#########",
    "..#",
    "..#",
    "..#",
    "..#",
    "..#",
  ],
};

export default icon;
