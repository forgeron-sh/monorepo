import type { PixelIcon } from "../types";

// Cart, second style: a handle, a deep basket and a base rail carrying two round wheels.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "shopping-cart-02",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "##",
    ".#",
    ".##########",
    ".#........#",
    "..#......#",
    "..########",
    "..#",
    "..#########",
    "...##...##",
    "...##...##",
  ],
};

export default icon;
