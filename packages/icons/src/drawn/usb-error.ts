import type { PixelIcon } from "../types";

// USB plug with an exclamation mark in the secondary tone on its body. Built on `usb`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "usb-error",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    "..#.#..#.#",
    "..#.#..#.#",
    "..#......#",
    ".##########",
    ".#...oo...#",
    ".#...oo...#",
    ".#........#",
    ".#...oo...#",
    ".##########",
  ],
};

export default icon;
