import type { PixelIcon } from "../types";

// Lines of a playlist with a music note.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "list-music",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".##########",
    "",
    "........oo",
    ".#####..o.o",
    "........o",
    "........o",
    ".####.ooo",
    "......oo",
  ],
};

export default icon;
