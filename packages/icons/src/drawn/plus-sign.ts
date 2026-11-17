import type { PixelIcon } from "../types";

// A plus sign: two crossing one-pixel bars, seven pixels long, crossing on the pixel at (5, 5): the
// line weight of the set (a two-pixel cross was tried and read heavier than its neighbours), half
// a pixel up and left of the exact centre, as docs/icons.md accepts for an odd stroke. Redrawn
// after Hugeicons `plus-sign` (Iconify preview, 2026-11-17): composition only. Drawn on 2026-11-17
// for the toggle of the site's FAQ, which used a rotated "+" glyph of the text face; checked at
// 16, 24 and 48 px in the gallery's review sheet, next to `lock` and `arrow-down-01`.
const icon: PixelIcon = {
  name: "plus-sign",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".....#",
    ".....#",
    ".....#",
    "..#######",
    ".....#",
    ".....#",
    ".....#",
  ],
};

export default icon;
