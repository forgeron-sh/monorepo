import type { PixelIcon } from "../types";

// Reduce paragraph: two lines with arrows pointing in towards them, expand-paragraph reversed.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "reduce-paragraph",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....oooo",
    ".....oo",
    "",
    ".##########",
    "",
    "",
    ".##########",
    "",
    ".....oo",
    "....oooo",
  ],
};

export default icon;
