import type { PixelIcon } from "../types";

// Double bed seen from the front: a headboard, two pillows in the secondary tone, a mattress and legs.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "bed-double",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#........#",
    ".#.oo..oo.#",
    ".#........#",
    ".##########",
    "#..........#",
    "############",
    "#..........#",
  ],
};

export default icon;
