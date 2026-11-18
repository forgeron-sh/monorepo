import type { PixelIcon } from "../types";

// Book with an AI sparkle badge: `book-01` one column left, a solid four-point sparkle in the secondary
// tone at the lower right, the book cut back one pixel around it.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "ai-book",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".########",
    ".###....#",
    ".###.##.#",
    ".###....#",
    ".###....#",
    ".###",
    ".###.....o",
    ".###....ooo",
    ".###...ooooo",
    ".#####..ooo",
    ".........o",
  ],
};

export default icon;
