import type { PixelIcon } from "../types";

// Sort 1 to 0: the down arrow of `arrow-down-a-z`, 1 above 0.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "arrow-down-1-0",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..o...##",
    "..o....#",
    "..o....#",
    "..o...###",
    "..o",
    "..o",
    "..o...##",
    "o.o.o#..#",
    ".ooo.#..#",
    "..o...##",
  ],
};

export default icon;
