import type { PixelIcon } from "../types";

// Less-than-or-equal sign in a circle.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "inequality-circle-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....####",
    "..##....##",
    ".#.....oo.#",
    ".#...oo...#",
    "#..oo......#",
    "#....oo....#",
    "#......oo..#",
    "#..........#",
    ".#.oooooo.#",
    ".#........#",
    "..##....##",
    "....####",
  ],
};

export default icon;
