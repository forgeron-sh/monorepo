import type { PixelIcon } from "../types";

// Filter lines, long to short, and a cross badge.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "filter-mail-remove",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    "",
    "",
    "...######",
    "",
    "",
    "....##.o...o",
    "........o.o",
    ".........o",
    "........o.o",
    ".......o...o",
  ],
};

export default icon;
