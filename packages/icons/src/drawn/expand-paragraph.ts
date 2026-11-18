import type { PixelIcon } from "../types";

// Expand paragraph: two lines of text between an arrowhead up and an arrowhead down.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "expand-paragraph",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....oo",
    "....oooo",
    "",
    ".##########",
    "",
    "",
    ".##########",
    "",
    "....oooo",
    ".....oo",
  ],
};

export default icon;
