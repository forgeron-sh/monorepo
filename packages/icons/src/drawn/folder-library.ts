import type { PixelIcon } from "../types";

// Folder holding two upright books and a leaning one.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "folder-library",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".####",
    ".#...######",
    ".#........#",
    ".#.o.o.o..#",
    ".#.o.o.o..#",
    ".#.o.o..o.#",
    ".#.o.o..o.#",
    ".##########",
  ],
};

export default icon;
