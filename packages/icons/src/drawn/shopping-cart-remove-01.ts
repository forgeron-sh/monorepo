import type { PixelIcon } from "../types";

// Cart of `shopping-cart-01` with a minus badge in the shared lower-right corner.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "shopping-cart-remove-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "##",
    ".#",
    ".##########",
    "..#......#",
    "..#......#",
    "..###",
    "......ooooo",
    "..##",
    "..##....##",
  ],
};

export default icon;
