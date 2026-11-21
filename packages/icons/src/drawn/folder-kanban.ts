import type { PixelIcon } from "../types";

// Folder with three kanban columns of different heights in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "folder-kanban",
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
    ".#.o...o..#",
    ".#.o......#",
    ".##########",
  ],
};

export default icon;
