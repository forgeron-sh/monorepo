import type { PixelIcon } from "../types";

// Double chevron pointing left: `arrow-right-double` mirrored.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "arrow-left-double",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    "....##..##",
    "...##..##",
    "..##..##",
    "..##..##",
    "...##..##",
    "....##..##",
  ],
};

export default icon;
