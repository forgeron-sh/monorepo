import type { PixelIcon } from "../types";

// Sort ascending: `sort-by-down-01` turned upside down, the arrow pointing up.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "sort-by-up-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....###",
    "..o",
    ".ooo",
    "o.o.o####",
    "..o",
    "..o",
    "..o..#####",
    "..o",
    "..o",
    "..o..######",
  ],
};

export default icon;
