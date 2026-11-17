import type { PixelIcon } from "../types";

// Ported from the site's lab icons (`hammer`), 12×12: `#` primary tone, `o` secondary tone.
const icon: PixelIcon = {
  name: "hammer",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#######o",
    "..#######o",
    "...######",
    ".....##",
    ".....oo",
    ".....oo",
    ".....oo",
    ".....oo",
    ".....oo",
  ],
};

export default icon;
