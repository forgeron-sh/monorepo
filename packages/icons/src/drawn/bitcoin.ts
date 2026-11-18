import type { PixelIcon } from "../types";

// Bitcoin sign: a B with two-pixel uprights and the two strokes above and below.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "bitcoin",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....#.#",
    "..######",
    "...##..##",
    "...##..##",
    "...######",
    "...##...##",
    "...##...##",
    "...##...##",
    "..#######",
    "....#.#",
  ],
};

export default icon;
