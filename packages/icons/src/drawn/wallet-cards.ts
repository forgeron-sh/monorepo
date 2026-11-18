import type { PixelIcon } from "../types";

// Wallet with a card in the secondary tone sticking out of the top.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "wallet-cards",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..oooooooo",
    "..o......o",
    ".##########",
    ".#........#",
    ".#.....####",
    ".#.....#..#",
    ".#.....####",
    ".#........#",
    ".##########",
  ],
};

export default icon;
