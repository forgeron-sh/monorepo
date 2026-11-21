import type { PixelIcon } from "../types";

// Loaf of bread: a domed top with three scores in the secondary tone, a flat base.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "bread-02",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    "...######",
    ".##......##",
    "#..o..o..o.#",
    "#.o..o..o..#",
    "#..........#",
    "#..........#",
    ".##########",
  ],
};

export default icon;
