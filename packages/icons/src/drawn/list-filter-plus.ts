import type { PixelIcon } from "../types";

// Filter list: lines getting shorter, a plus in the secondary tone beside the shortest.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "list-filter-plus",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".##########",
    "",
    "",
    ".#######",
    "",
    ".........o",
    ".####...ooo",
    ".........o",
  ],
};

export default icon;
