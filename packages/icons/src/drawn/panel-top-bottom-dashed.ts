import type { PixelIcon } from "../types";

// Window with dashed lines marking a top and a bottom panel.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "panel-top-bottom-dashed",
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
    ".#oo.oo.oo#",
    ".#........#",
    ".#........#",
    ".##########",
  ],
};

export default icon;
