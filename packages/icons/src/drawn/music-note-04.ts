import type { PixelIcon } from "../types";

// Half note: a hollow slanted head on a stem.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "music-note-04",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "......#",
    "......#",
    "......#",
    "......#",
    "......#",
    "......#",
    "......#",
    "......#",
    "...####",
    "..#...#",
    "...###",
  ],
};

export default icon;
