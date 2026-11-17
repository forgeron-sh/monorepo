import type { PixelIcon } from "../types";

// A browser window with a gauge inside.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "dashboard-browsing",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#........#",
    ".##########",
    ".#........#",
    ".#........#",
    ".#...oo...#",
    ".#..o..o..#",
    ".#.o..o.o.#",
    ".#.o...oo.#",
    ".##########",
  ],
};

export default icon;
