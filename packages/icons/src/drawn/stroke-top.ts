import type { PixelIcon } from "../types";

// Top stroke: a dashed square whose top side is a solid line in the secondary tone, `stroke-left` turned.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "stroke-top",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".oooooooooo",
    "",
    ".#........#",
    ".#........#",
    "",
    "",
    ".#........#",
    ".#........#",
    "",
    ".#.##..##.#",
  ],
};

export default icon;
