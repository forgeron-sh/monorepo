import type { PixelIcon } from "../types";

// The Claude mark in pixels: an uneven starburst of rays around a solid core.
// 12×12: `#` primary tone. Rasterised from `simple-icons:claude` (Iconify, 2026-11-18), then redrawn by hand. Drawn on 2026-11-18.
// Claude and the Claude logo are trademarks of Anthropic, PBC, used here only to refer to Claude.
const icon: PixelIcon = {
  name: "claude",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "...#.....#",
    "...##..#.#",
    ".#..#.#.#",
    "..#.#.#.#..#",
    "...######.#",
    "##.#######",
    "..########.#",
    ".#.######",
    "...######.#",
    "..#.#.#.#",
    ".#..#..#.#",
    "....#...#",
  ],
};

export default icon;
