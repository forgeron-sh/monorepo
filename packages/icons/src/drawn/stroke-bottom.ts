import type { PixelIcon } from "../types";

// Bottom stroke: a dashed square whose bottom side is a solid line in the secondary tone, `stroke-left` turned.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "stroke-bottom",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".#.##..##.#",
    "",
    ".#........#",
    ".#........#",
    "",
    "",
    ".#........#",
    ".#........#",
    "",
    ".oooooooooo",
  ],
};

export default icon;
