import type { PixelIcon } from "../types";

// A person, head in the secondary tone as in `user`, in front of a presentation screen.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "co-present",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....#######",
    ".....#.....#",
    ".....#.....#",
    ".oo..#.....#",
    "o..o.#.....#",
    "o..o.#######",
    ".oo",
    "",
    ".####",
    "#....#",
    "######",
  ],
};

export default icon;
