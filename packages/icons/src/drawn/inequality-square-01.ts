import type { PixelIcon } from "../types";

// A rounded square holding the inequality of `inequality-01` in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "inequality-square-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#........#",
    ".#.....oo.#",
    ".#...oo...#",
    ".#.oo.....#",
    ".#.oooooo.#",
    ".#........#",
    ".#.oooooo.#",
    ".#........#",
    "..########",
  ],
};

export default icon;
