import type { PixelIcon } from "../types";

// Certificate: a framed sheet with a line, a seal in the secondary tone breaking its bottom edge
// and two ribbon tails.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "certificate-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#........#",
    ".#.######.#",
    ".#........#",
    ".#....oo..#",
    ".#...o..o.#",
    ".#...o..o.#",
    ".###..oo..#",
    ".....o..o",
    ".....o..o",
  ],
};

export default icon;
