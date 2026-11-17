import type { PixelIcon } from "../types";

// A minus sign: the horizontal bar of `plus-sign`, one pixel thick and seven long, on the same
// row, so that the two swap in place. Redrawn after Hugeicons `minus-sign` (Iconify preview,
// 2026-11-17): composition only. Drawn on 2026-11-17 for the open state of the site's FAQ.
const icon: PixelIcon = {
  name: "minus-sign",
  implemented: true,
  style: "pixel",
  grid: 12,
  rows: [
    "............",
    "............",
    "............",
    "............",
    "............",
    "..#######...",
    "............",
    "............",
    "............",
    "............",
    "............",
    "............",
  ],
};

export default icon;
