import type { PixelIcon } from "../types";

// Taj Mahal: an onion dome with its finial on an arched hall, a minaret on each side.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "taj-mahal",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".....##",
    "....####",
    "...#....#",
    "#.#......#.#",
    "#.#......#.#",
    "#.########.#",
    "#.#......#.#",
    "#.#..##..#.#",
    "#.#.#..#.#.#",
    "#.#.#..#.#.#",
    "#.#.#..#.#.#",
    "############",
  ],
};

export default icon;
