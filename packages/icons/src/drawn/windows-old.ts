import type { PixelIcon } from "../types";

// The earlier Windows mark: four panes in perspective, the right ones taller.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "windows-old",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....######",
    ".....######",
    ".###.######",
    ".###.######",
    ".###.######",
    "",
    ".###.######",
    ".###.######",
    ".###.######",
    ".....######",
    ".....######",
  ],
};

export default icon;
