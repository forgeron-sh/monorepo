import type { PixelIcon } from "../types";

// Kanban.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "kanban",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".###.###.###",
    ".###.###.###",
    ".....###",
    ".###.###.###",
    ".###.....###",
    ".....###.###",
    ".###.###",
    ".###.###",
  ],
};

export default icon;
