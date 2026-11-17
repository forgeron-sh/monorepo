import type { PixelIcon } from "../types";

// Tree list: a root line and three child lines hanging from one connector.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "list-tree",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".########",
    ".#",
    ".#",
    ".###.######",
    ".#",
    ".#",
    ".###.######",
    ".#",
    ".#",
    ".###.######",
  ],
};

export default icon;
