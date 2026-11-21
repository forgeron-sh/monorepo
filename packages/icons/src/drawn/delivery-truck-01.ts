import type { PixelIcon } from "../types";

// Delivery: the lorry of `truck`, shortened, with two speed lines in the secondary tone behind it.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "delivery-truck-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "...#####",
    "...#...#",
    "oo.#...###",
    "...#...#..#",
    "oo.#...#..#",
    "...########",
    "....##..##",
    "....##..##",
  ],
};

export default icon;
