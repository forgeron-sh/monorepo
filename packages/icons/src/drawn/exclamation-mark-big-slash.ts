import type { PixelIcon } from "../types";

// A bold exclamation mark struck through.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "exclamation-mark-big-slash",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".o..####",
    "..o.####",
    "...o.###",
    "....o.##",
    ".....o",
    "......o",
    ".......o",
    "........o",
    ".....##..o",
    ".....##...o",
  ],
};

export default icon;
