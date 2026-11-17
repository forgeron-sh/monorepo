import type { PixelIcon } from "../types";

// Arrow that runs up then turns left, in the ring of `circle-arrow-down-01`: `circle-arrow-move-down-left` flipped.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "circle-arrow-move-up-left",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#......#",
    ".#..o.....#",
    ".#.oooooo.#",
    ".#..o...o.#",
    ".#......o.#",
    ".#......o.#",
    ".#......o.#",
    "..#......#",
    "...######",
  ],
};

export default icon;
