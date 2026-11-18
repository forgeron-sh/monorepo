import type { PixelIcon } from "../types";

// A shopping cart with an arrow pointing out. Base from `shopping-cart-add-01`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "shopping-cart-check-out-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "##",
    ".#",
    ".##########",
    "..#",
    "..#.....o",
    "..###....o",
    "......ooooo",
    "..##.....o",
    "..##....o",
  ],
};

export default icon;
