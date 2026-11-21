import type { PixelIcon } from "../types";

// Arrow that runs left then turns down, in the ring of `circle-arrow-down-01`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "circle-arrow-move-left-down",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#......#",
    ".#..ooooo.#",
    ".#..o.....#",
    ".#..o.....#",
    ".#..o.....#",
    ".#.ooo....#",
    ".#..o.....#",
    "..#......#",
    "...######",
  ],
};

export default icon;
