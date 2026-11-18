import type { PixelIcon } from "../types";

// The PayPal mark in pixels: the slanted front P in the secondary tone over the back P that shows
// round its edge.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "paypal",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..######",
    "..#",
    "..#.oooooo",
    "..#.oo...oo",
    "..#.oo...oo",
    "..#.oooooo",
    "..#.oo",
    "....oo",
    "....oo",
  ],
};

export default icon;
