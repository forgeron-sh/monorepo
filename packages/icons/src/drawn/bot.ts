import type { PixelIcon } from "../types";

// Bot: a head with an antenna, two ears, two eyes in the secondary tone and a mouth.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "bot",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##",
    ".....##",
    ".##########",
    ".#........#",
    "##.oo..oo.##",
    "##.oo..oo.##",
    ".#........#",
    ".#..####..#",
    ".#........#",
    ".##########",
  ],
};

export default icon;
