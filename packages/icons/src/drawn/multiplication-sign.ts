import type { PixelIcon } from "../types";

// A multiplication sign: `cancel-01` at six pixels instead of eight, about the size of
// `plus-sign`, crossing on a 2×2 centre.
// Redrawn after Hugeicons `multiplication-sign` (Iconify preview, 2026-11-17): composition only.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "multiplication-sign",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    "...#....#",
    "....#..#",
    ".....##",
    ".....##",
    "....#..#",
    "...#....#",
  ],
};

export default icon;
