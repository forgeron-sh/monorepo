import type { PixelIcon } from "../types";

// Wireless sharing: concentric arcs opening down over a small triangle.
// 12×12: `#` primary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "airdrop",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    ".##......##",
    "#..######..#",
    "#.#......#.#",
    "#.#..##..#.#",
    "..#.#..#.#",
    "....#..#",
    ".....##",
    "....####",
    "...######",
  ],
};

export default icon;
