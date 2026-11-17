import type { PixelIcon } from "../types";

// Dashboard layout: a window with a tall panel in the secondary tone beside two tiles (two small tiles
// above a wide panel read as a face, a panel above two tiles as a shop front).
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "layout-dashboard",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#........#",
    ".#.oo.###.#",
    ".#.oo.###.#",
    ".#.oo.....#",
    ".#.oo.....#",
    ".#.oo.###.#",
    ".#.oo.###.#",
    ".#........#",
    ".##########",
  ],
};

export default icon;
