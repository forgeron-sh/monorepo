import type { PixelIcon } from "../types";

// Square panel split at the bottom by a dashed line in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "panel-bottom-dashed",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#........#",
    ".#........#",
    ".#........#",
    ".#........#",
    ".#........#",
    ".#oo.oo.oo#",
    ".#........#",
    ".#........#",
    ".##########",
  ],
};

export default icon;
