import type { PixelIcon } from "../types";

// Sort narrow to wide: the arrow of `sort-by-down-01`, bars growing downwards.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "arrow-down-narrow-wide",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..o..###",
    "..o",
    "..o",
    "..o..####",
    "..o",
    "..o",
    "o.o.o#####",
    ".ooo",
    "..o",
    ".....######",
  ],
};

export default icon;
