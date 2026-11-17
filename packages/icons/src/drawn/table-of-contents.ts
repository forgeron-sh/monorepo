import type { PixelIcon } from "../types";

// Contents list: three entry lines, their page numbers in the secondary tone at the right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "table-of-contents",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".#######.oo",
    "",
    "",
    ".#######.oo",
    "",
    "",
    ".#######.oo",
  ],
};

export default icon;
