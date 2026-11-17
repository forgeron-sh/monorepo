import type { PixelIcon } from "../types";

// Wallet with a minus badge: `wallet-add-01` with a minus in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "wallet-remove-01",
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
    ".#",
    ".#",
    ".####.ooooo",
  ],
};

export default icon;
