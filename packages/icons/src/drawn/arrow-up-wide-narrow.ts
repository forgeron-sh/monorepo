import type { PixelIcon } from "../types";

// An upward arrow beside bars from long to short.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "arrow-up-wide-narrow",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..o..#######",
    ".ooo",
    "o.o.o",
    "..o..#####",
    "..o",
    "..o",
    "..o..###",
    "..o",
    "..o",
    "..o..#",
  ],
};

export default icon;
