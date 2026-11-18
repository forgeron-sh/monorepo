import type { PixelIcon } from "../types";

// A shopping cart with a star badge. Base from `shopping-cart-add-01`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "shopping-cart-favorite-01",
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
    "..###.ooooo",
    ".......ooo",
    "..##...ooo",
    "..##..o...o",
  ],
};

export default icon;
