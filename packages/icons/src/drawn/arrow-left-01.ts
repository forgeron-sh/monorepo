import type { PixelIcon } from "../types";

// Chevron pointing left: the right chevron mirrored, one tone.
// Proportions after Hugeicons `arrow-left-01` (Iconify preview, 2026-11-16), redrawn as pixel art, not traced.
const icon: PixelIcon = {
  name: "arrow-left-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".......##",
    "......##",
    ".....##",
    "....##",
    "....##",
    ".....##",
    "......##",
    ".......##",
  ],
};

export default icon;
