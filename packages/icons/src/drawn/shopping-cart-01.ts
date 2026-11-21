import type { PixelIcon } from "../types";

// Cart: a handle, a basket narrowing at the bottom, two square wheels.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "shopping-cart-01",
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
    "..########",
    "",
    "..##....##",
    "..##....##",
  ],
};

export default icon;
