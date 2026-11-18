import type { PixelIcon } from "../types";

// Folder tree: two small folders hanging off a tree line in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "folder-tree",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "o..###",
    "o..########",
    "oo.#......#",
    "o..########",
    "o",
    "o",
    "o..###",
    "o..########",
    "oo.#......#",
    "...########",
  ],
};

export default icon;
