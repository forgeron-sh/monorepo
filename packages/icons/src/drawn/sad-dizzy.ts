import type { PixelIcon } from "../types";

// Dizzy sad face: the face of `sad-01` with two crosses for eyes and a frown in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "sad-dizzy",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#......#",
    ".#.#.#.#.#",
    ".#..#..#.#",
    ".#.#.#.#.#",
    ".#........#",
    ".#..oooo..#",
    ".#.o....o.#",
    "..#......#",
    "...######",
  ],
};

export default icon;
