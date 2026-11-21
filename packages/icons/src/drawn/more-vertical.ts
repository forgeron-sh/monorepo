import type { PixelIcon } from "../types";

// Three dots, stacked: `more-horizontal` turned.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "more-vertical",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##",
    ".....##",
    "",
    "",
    ".....##",
    ".....##",
    "",
    "",
    ".....##",
    ".....##",
  ],
};

export default icon;
