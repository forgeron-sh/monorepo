import type { PixelIcon } from "../types";

// Cloud loading: the outline of `cloud` with three two-pixel dots inside, in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "cloud-loading",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".....###",
    "....#...#",
    "..###....#",
    ".#........#",
    "#..........#",
    "#.oo.oo.oo.#",
    "#..........#",
    ".##########",
  ],
};

export default icon;
