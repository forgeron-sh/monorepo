import type { PixelIcon } from "../types";

// A magnifying glass with a bitcoin sign in its lens.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "bitcoin-search",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "..######",
    ".#......#",
    "#........#",
    "#..oooo..#",
    "#..o...o.#",
    "#..oooo..#",
    "#..o...o.#",
    "#..oooo..#",
    ".#......#",
    "..######.#",
    ".........##",
    "..........##",
  ],
};

export default icon;
