import type { PixelIcon } from "../types";

// Bank: a pediment filled in the secondary tone, three two-pixel columns, a plinth.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "bank",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##",
    "...##oo##",
    ".##oooooo##",
    ".##########",
    ".##..##..##",
    ".##..##..##",
    ".##..##..##",
    ".##..##..##",
    ".##########",
    ".##########",
  ],
};

export default icon;
