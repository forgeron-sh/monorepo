import type { PixelIcon } from "../types";

// No italic: the slanted letter I of text-italic, crossed by a slash in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "text-italic-slash",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".o..######",
    "..o...##",
    "...o..##",
    "....o.##",
    ".....o",
    "......o",
    "....##.o",
    "....##..o",
    "....##...o",
    "..######..o",
  ],
};

export default icon;
