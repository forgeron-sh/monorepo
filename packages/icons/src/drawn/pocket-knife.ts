import type { PixelIcon } from "../types";

// Pocket knife: a rounded handle with the blade folded out at the top left in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "pocket-knife",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "o",
    "oo",
    "o.o",
    ".o.o",
    "..o.o",
    "...########",
    "..#........#",
    "..#........#",
    "...########",
  ],
};

export default icon;
