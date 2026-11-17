import type { PixelIcon } from "../types";

// Card with a heart in the secondary tone (loyalty card).
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "loyalty-card",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".##########",
    ".#........#",
    ".#.oo..oo.#",
    ".#.oooooo.#",
    ".#..oooo..#",
    ".#...oo...#",
    ".#........#",
    ".##########",
  ],
};

export default icon;
