import type { PixelIcon } from "../types";

// The wallet of `wallet-01` and the bitcoin badge of `file-bitcoin` in the lower-right corner.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "bitcoin-wallet",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "..#######",
    ".##########",
    ".#........#",
    ".#.....####",
    ".#.....#..#",
    ".#.....####",
    ".#",
    ".#####.oooo",
    ".......o...o",
    ".......oooo",
    ".......o...o",
    ".......oooo",
  ],
};

export default icon;
