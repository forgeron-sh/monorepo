import type { PixelIcon } from "../types";

// Pie from the side: a domed crust with two vents in the secondary tone over a sloped dish.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "pie",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    "...######",
    "..#.o..o.#",
    ".#.o..o...#",
    "############",
    ".#........#",
    "..########",
  ],
};

export default icon;
