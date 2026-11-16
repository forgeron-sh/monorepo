import type { PixelIcon } from "../types";

// Ported from the site's lab icons (`preview`), 12×12: `#` primary tone, `o` secondary tone.
const icon: PixelIcon = {
  name: "eye",
  implemented: true,
  style: "pixel",
  grid: 12,
  rows: [
    "",
    "",
    "",
    "...######",
    ".##......##",
    "#....oo....#",
    "#...oooo...#",
    "#....oo....#",
    ".##......##",
    "...######",
  ],
};

export default icon;
