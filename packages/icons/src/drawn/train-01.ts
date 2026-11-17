import type { PixelIcon } from "../types";

// Train seen from the front: the windscreen in the secondary tone, a body, two lamps, splayed rails.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "train-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#......#",
    "..#oooooo#",
    "..#oooooo#",
    "..#......#",
    "..#......#",
    "..#.##.#.#",
    "..########",
    "...#....#",
    "..#......#",
  ],
};

export default icon;
