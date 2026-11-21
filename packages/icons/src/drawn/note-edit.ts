import type { PixelIcon } from "../types";

// A note being edited: the note of `note-add` with a pencil badge in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "note-edit",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".########",
    ".#......#",
    ".#.####.#",
    ".#......#",
    ".#.##",
    ".#.......oo",
    ".#......oo",
    ".####..oo",
    "......oo",
    "......o",
  ],
};

export default icon;
