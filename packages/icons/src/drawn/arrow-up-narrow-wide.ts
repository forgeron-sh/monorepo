import type { PixelIcon } from "../types";

// An upward arrow beside bars from short to long.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "arrow-up-narrow-wide",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..o..#",
    ".ooo",
    "o.o.o",
    "..o..###",
    "..o",
    "..o",
    "..o..#####",
    "..o",
    "..o",
    "..o..#######",
  ],
};

export default icon;
