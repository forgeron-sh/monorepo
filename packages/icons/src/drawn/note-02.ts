import type { PixelIcon } from "../types";

// Sticky note: the sheet of `note-01` with its fold at the lower right, the lines in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "note-02",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".##########",
    ".#........#",
    ".#.oooooo.#",
    ".#........#",
    ".#.oooooo.#",
    ".#........#",
    ".#.oooo...#",
    ".#........#",
    ".#.....####",
    ".#.....#.#",
    ".#.....##",
    ".#######",
  ],
};

export default icon;
