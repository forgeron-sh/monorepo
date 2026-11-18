import type { PixelIcon } from "../types";

// The Shopify mark in pixels: the shopping bag with its handle and the S cut out of its front.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "shopify",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....##",
    "...#..#",
    "..########o",
    "..#######oo",
    ".####..##oo",
    ".###.####oo",
    ".####..##oo",
    ".######.#oo",
    ".###...##oo",
    ".#########o",
    ".#########",
  ],
};

export default icon;
