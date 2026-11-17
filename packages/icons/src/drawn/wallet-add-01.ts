import type { PixelIcon } from "../types";

// Wallet with a plus badge: `wallet-01` cut back around the badge in the shared lower-right corner.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "wallet-add-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..#######",
    ".##########",
    ".#........#",
    ".#.....####",
    ".#",
    ".#......o",
    ".#......o",
    ".####.ooooo",
    "........o",
    "........o",
  ],
};

export default icon;
