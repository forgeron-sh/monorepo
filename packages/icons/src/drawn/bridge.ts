import type { PixelIcon } from "../types";

// Bridge: a suspension bridge: two towers, the cables and the deck.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "bridge",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..#......#",
    ".###....###",
    "#.#.#..#.#.#",
    "..#..##..#",
    "..#......#",
    "############",
    "..#......#",
    "..#......#",
    "..#......#",
  ],
};

export default icon;
