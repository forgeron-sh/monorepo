import type { PixelIcon } from "../types";

// Sort: a solid caret up above a solid caret down, as on a table header.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "sorting-03",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##",
    "....####",
    "...######",
    "..########",
    "",
    "",
    "..########",
    "...######",
    "....####",
    ".....##",
  ],
};

export default icon;
