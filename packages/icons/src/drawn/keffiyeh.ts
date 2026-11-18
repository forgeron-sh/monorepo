import type { PixelIcon } from "../types";

// Keffiyeh: the cloth over the head falling straight to the shoulders, held by an agal cord in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "keffiyeh",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "...######",
    "..oooooooo",
    "..#.####.#",
    "..#.#..#.#",
    "..#.#..#.#",
    "..#..##..#",
    "..#......#",
    ".#........#",
    "#..........#",
    "############",
  ],
};

export default icon;
