import type { PixelIcon } from "../types";

// Degrees Fahrenheit: a small degree ring in the secondary tone beside a capital F.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "fahrenheit",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".oo...#####",
    "o..o..#",
    "o..o..#",
    ".oo...#",
    "......####",
    "......#",
    "......#",
    "......#",
    "......#",
    "......#",
  ],
};

export default icon;
