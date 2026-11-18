import type { PixelIcon } from "../types";

// Sort descending: an arrow down in the secondary tone beside three bars getting shorter, as in `sorting-01`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "sort-by-down-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..o..######",
    "..o",
    "..o",
    "..o..#####",
    "..o",
    "..o",
    "o.o.o####",
    ".ooo",
    "..o",
    ".....###",
  ],
};

export default icon;
