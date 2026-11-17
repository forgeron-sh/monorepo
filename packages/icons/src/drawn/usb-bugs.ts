import type { PixelIcon } from "../types";

// USB plug with a bug badge in the secondary tone, lower right: an infected drive. Built on `usb`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "usb-bugs",
  implemented: true,
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
    ".#",
    ".#.....o...o",
    ".#......ooo",
    ".#.....ooooo",
    ".#####..ooo",
    ".......o...o",
  ],
};

export default icon;
