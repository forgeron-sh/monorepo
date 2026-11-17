import type { PixelIcon } from "../types";

// Property sheet: a window with a title bar and two dotted entries.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "property-new",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#........#",
    ".##########",
    ".#........#",
    ".#.#.####.#",
    ".#........#",
    ".#........#",
    ".#.#.####.#",
    ".#........#",
    "..########",
  ],
};

export default icon;
