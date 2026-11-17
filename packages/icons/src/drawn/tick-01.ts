import type { PixelIcon } from "../types";

// Check mark, 12×12: the short arm in the secondary tone, the long arm in the primary.
// Proportions after Hugeicons `tick-01` (Iconify preview, 2026-11-16), redrawn as pixel art, not traced.
const icon: PixelIcon = {
  name: "tick-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "..........##",
    ".........##",
    "........##",
    ".oo....##",
    "..oo..##",
    "...oo##",
    "....##",
  ],
};

export default icon;
