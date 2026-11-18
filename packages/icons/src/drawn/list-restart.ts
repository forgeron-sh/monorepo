import type { PixelIcon } from "../types";

// List with a circular restart arrow in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "list-restart",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    "",
    "........o",
    ".####..oooo",
    "........o..o",
    "......o....o",
    "......o....o",
    ".####..o...o",
    "........ooo",
  ],
};

export default icon;
