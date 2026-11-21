import type { PixelIcon } from "../types";

// Garlands: two strings of pennant flags, the pennants in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "garlands",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "############",
    ".oooo..oooo",
    ".oooo..oooo",
    "..oo....oo",
    "..oo....oo",
    "############",
    "....oooo",
    "....oooo",
    ".....oo",
    ".....oo",
  ],
};

export default icon;
