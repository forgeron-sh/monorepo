import type { PixelIcon } from "../types";

// Screen open at the bottom with a solid triangle entering it, the triangle in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "airplay",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#........#",
    ".#........#",
    ".#........#",
    ".#........#",
    ".#........#",
    ".###....###",
    ".....oo",
    "....oooo",
    "...oooooo",
  ],
};

export default icon;
