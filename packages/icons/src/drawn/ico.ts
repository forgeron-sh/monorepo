import type { PixelIcon } from "../types";

// ICO file: the sheet of `file-01` with a small rounded app icon in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "ico",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..#####",
    "..#...##",
    "..#...#.#",
    "..#...####",
    "..#......#",
    "..#.oooo.#",
    "..#.o..o.#",
    "..#.o..o.#",
    "..#.oooo.#",
    "..########",
  ],
};

export default icon;
