import type { PixelIcon } from "../types";

// Newspaper: a page, the headline in the secondary tone, a picture and lines.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "news",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#........#",
    ".#.oooooo.#",
    ".#........#",
    ".#.###.##.#",
    ".#.###....#",
    ".#.###.##.#",
    ".#........#",
    ".#.######.#",
    ".##########",
  ],
};

export default icon;
