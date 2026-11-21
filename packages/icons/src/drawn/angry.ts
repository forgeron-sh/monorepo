import type { PixelIcon } from "../types";

// Angry face: the ring of `smile`, two eyes slanting down to the centre, the frown of `sad-01` in the
// secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "angry",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#......#",
    ".#........#",
    ".#.#....#.#",
    ".#..#..#..#",
    ".#........#",
    ".#..oooo..#",
    ".#.o....o.#",
    "..#......#",
    "...######",
  ],
};

export default icon;
