import type { PixelIcon } from "../types";

// Folder with a dot: `folder-01`, a two-by-two dot in the secondary tone at its centre.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "folder-dot",
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
    ".#........#",
    ".#...oo...#",
    ".#...oo...#",
    ".#........#",
    ".##########",
  ],
};

export default icon;
