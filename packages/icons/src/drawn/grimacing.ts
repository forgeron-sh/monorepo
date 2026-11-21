import type { PixelIcon } from "../types";

// Grimacing face: the ring of `smile`, two eyes, clenched teeth in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "grimacing",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#......#",
    ".#........#",
    ".#..#..#..#",
    ".#..#..#..#",
    ".#........#",
    ".#.oooooo.#",
    ".#.o.o.o.o#",
    "..#......#",
    "...######",
  ],
};

export default icon;
