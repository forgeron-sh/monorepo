import type { PixelIcon } from "../types";

// Ported from the site's lab icons (`deploy`), 12×12: `#` primary tone, `o` secondary tone.
const icon: PixelIcon = {
  name: "deploy",
  implemented: true,
  style: "pixel",
  grid: 12,
  rows: [
    "",
    ".....oo",
    "....oooo",
    "...oooooo",
    ".....oo",
    ".....oo",
    ".....oo",
    "",
    "#..........#",
    "#..........#",
    "############",
  ],
};

export default icon;
