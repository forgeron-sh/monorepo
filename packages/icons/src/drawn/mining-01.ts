import type { PixelIcon } from "../types";

// Crypto mining: a pickaxe swung on the diagonal and the bitcoin badge of `file-bitcoin`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "mining-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "......####",
    ".....##.###",
    "....##...##",
    "...##.....#",
    "..##",
    ".##....oooo",
    "##.....o...o",
    ".......oooo",
    ".......o...o",
    ".......oooo",
  ],
};

export default icon;
