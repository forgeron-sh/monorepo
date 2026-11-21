import type { PixelIcon } from "../types";

// Horizontal scroll: two solid arrowheads pointing left and right around a dot in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "horizonal-scroll-point",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    "..#......#",
    ".##......##",
    "###..oo..###",
    "###..oo..###",
    ".##......##",
    "..#......#",
  ],
};

export default icon;
