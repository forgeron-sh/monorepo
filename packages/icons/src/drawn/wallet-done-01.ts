import type { PixelIcon } from "../types";

// Wallet with a check badge: `wallet-add-01` cut back around a check in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "wallet-done-01",
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
    ".#........o",
    ".####....o",
    "......o.o",
    ".......o",
  ],
};

export default icon;
