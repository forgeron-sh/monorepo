import type { PixelIcon } from "../types";

// Ported from the site's lab icons (`rollback`), 12×12: `#` primary tone, `o` secondary tone.
const icon: PixelIcon = {
  name: "rollback",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "...o",
    "..oo",
    ".oooooooo",
    "..oo.....#",
    "...o......#",
    "..........#",
    ".........#",
    "...######",
  ],
};

export default icon;
