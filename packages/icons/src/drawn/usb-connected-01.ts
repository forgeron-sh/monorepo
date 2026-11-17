import type { PixelIcon } from "../types";

// USB plug with its cable in the secondary tone: plugged in.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "usb-connected-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "..########",
    "..#.#..#.#",
    "..#......#",
    ".##########",
    ".#........#",
    ".#........#",
    ".#........#",
    "..#......#",
    "...######",
    ".....oo",
    ".....oo",
    ".....oo",
  ],
};

export default icon;
