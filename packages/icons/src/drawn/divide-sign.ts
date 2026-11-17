import type { PixelIcon } from "../types";

// A division sign: the one-pixel bar on the row of `plus-sign` and `minus-sign` (half a pixel
// above the centre, as docs/icons.md accepts for an odd stroke), a two-by-two dot above and
// below, two-pixel gaps.
// Redrawn after Hugeicons `divide-sign` (Iconify preview, 2026-11-17): composition only.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "divide-sign",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##",
    ".....##",
    "",
    "",
    "..########",
    "",
    "",
    ".....##",
    ".....##",
  ],
};

export default icon;
