import type { PixelIcon } from "../types";

// Accessibility: a figure with its arms spread and legs apart, the head in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "accessibility",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....oo",
    ".....oo",
    "",
    ".##########",
    ".....##",
    ".....##",
    "....####",
    "...##..##",
    "..##....##",
    ".##......##",
  ],
};

export default icon;
