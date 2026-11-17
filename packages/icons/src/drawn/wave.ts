import type { PixelIcon } from "../types";

// Waves: three wavy lines, the middle one in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "wave",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##..##..##",
    "#..##..##..#",
    "",
    "",
    ".oo..oo..oo",
    "o..oo..oo..o",
    "",
    "",
    ".##..##..##",
    "#..##..##..#",
  ],
};

export default icon;
