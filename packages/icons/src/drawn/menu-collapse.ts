import type { PixelIcon } from "../types";

// Collapse the menu: the bars of `menu-01` shortened, a chevron pointing left in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "menu-collapse",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    ".....######",
    "...o",
    "..o",
    ".o...######",
    "..o",
    "...o",
    ".....######",
  ],
};

export default icon;
