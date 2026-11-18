import type { PixelIcon } from "../types";

// Pool table from the side: three balls on the cloth in the secondary tone, the table on legs.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "pool-table",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    "..oo.oo.oo",
    "..oo.oo.oo",
    "############",
    "#..........#",
    "############",
    ".#........#",
    ".#........#",
    ".#........#",
  ],
};

export default icon;
