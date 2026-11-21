import type { PixelIcon } from "../types";

// Filter lines, long to short, and a pencil badge.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "filter-mail-edit",
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
    "....##....oo",
    ".........o.o",
    "........o.o",
    ".......o.o",
    ".......oo",
  ],
};

export default icon;
