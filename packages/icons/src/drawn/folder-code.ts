import type { PixelIcon } from "../types";

// Folder with code brackets inside: `folder-01`, a `<` and a `>` in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "folder-code",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".####",
    ".#...######",
    ".#........#",
    ".#..o..o..#",
    ".#.o....o.#",
    ".#..o..o..#",
    ".#........#",
    ".##########",
  ],
};

export default icon;
