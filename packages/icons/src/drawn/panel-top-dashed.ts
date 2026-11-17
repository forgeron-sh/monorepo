import type { PixelIcon } from "../types";

// Window with a dashed line marking a top panel.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "panel-top-dashed",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#........#",
    ".#........#",
    ".#oo.oo.oo#",
    ".#........#",
    ".#........#",
    ".#........#",
    ".#........#",
    ".#........#",
    ".##########",
  ],
};

export default icon;
