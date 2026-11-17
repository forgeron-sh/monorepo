import type { PixelIcon } from "../types";

// Wi-Fi in a square: the frame of `square`, a small Wi-Fi in the secondary tone, as in `wifi-circle`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "wifi-square",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#........#",
    ".#..oooo..#",
    ".#.o....o.#",
    ".#........#",
    ".#..oooo..#",
    ".#........#",
    ".#...oo...#",
    ".#........#",
    "..########",
  ],
};

export default icon;
