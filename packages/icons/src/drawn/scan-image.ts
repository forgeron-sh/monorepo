import type { PixelIcon } from "../types";

// Scan a picture: the brackets of `scan` round a sun and two peaks in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "scan-image",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".###....###",
    ".#........#",
    ".#.....oo.#",
    ".......oo",
    "....o",
    "...ooo..o",
    "..oooooooo",
    ".#........#",
    ".#........#",
    ".###....###",
  ],
};

export default icon;
