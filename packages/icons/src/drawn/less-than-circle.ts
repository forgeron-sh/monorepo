import type { PixelIcon } from "../types";

// Less-than of `less-than` in the secondary tone inside the full-grid ring of `circle`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "less-than-circle",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....####",
    "..##....##",
    ".#........#",
    ".#.....oo.#",
    "#....oo....#",
    "#..oo......#",
    "#..oo......#",
    "#....oo....#",
    ".#.....oo.#",
    ".#........#",
    "..##....##",
    "....####",
  ],
};

export default icon;
