import type { PixelIcon } from "../types";

// Drawn for the home page's catalog, 12×12: `#` primary tone, `o` secondary tone.
const icon: PixelIcon = {
  name: "note-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".#######",
    ".#.....##",
    ".#.....#.#",
    ".#.....####",
    ".#........#",
    ".#.oooooo.#",
    ".#........#",
    ".#.oooooo.#",
    ".#........#",
    ".#.oooo...#",
    ".#........#",
    ".##########",
  ],
};

export default icon;
