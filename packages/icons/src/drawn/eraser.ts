import type { PixelIcon } from "../types";

// Eraser lying at 45° on the line it erased: a one-pixel outline, the rubber end solid in the
// secondary tone, a short baseline to its right. A smaller block read as a tag.
// Redrawn after Hugeicons `eraser` (Iconify preview, 2026-11-17): composition only.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "eraser",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".......#",
    "......#.#",
    ".....#...#",
    "....#.....#",
    "...#.....#",
    "..#oo...#",
    ".#oooo.#",
    "..#ooo#",
    "...#o#",
    "....#..####",
  ],
};

export default icon;
