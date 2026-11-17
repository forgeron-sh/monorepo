import type { PixelIcon } from "../types";

// Right-to-left list with dashes: lines on the left, a dash at the right of each.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "right-to-left-list-dash",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".######.ooo",
    "",
    "",
    ".######.ooo",
    "",
    "",
    ".######.ooo",
    "",
    "",
    ".######.ooo",
  ],
};

export default icon;
