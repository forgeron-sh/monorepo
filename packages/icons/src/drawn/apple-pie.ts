import type { PixelIcon } from "../types";

// An apple pie: a lattice crust domed over a deep tin.
// 12×12: `#` primary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "apple-pie",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "...######",
    ".##..##..##",
    "##.##..##.##",
    "############",
    "#..........#",
    "#.#.#.#.#.##",
    ".##########",
    "..########",
  ],
};

export default icon;
