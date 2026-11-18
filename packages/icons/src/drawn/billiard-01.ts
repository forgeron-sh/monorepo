import type { PixelIcon } from "../types";

// Billiard balls racked in a triangle, the front ball in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "billiard-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".##..##..##",
    ".##..##..##",
    "",
    "...##..##",
    "...##..##",
    "",
    ".....oo",
    ".....oo",
  ],
};

export default icon;
