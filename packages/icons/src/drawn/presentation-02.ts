import type { PixelIcon } from "../types";

// Presentation with text: the board of `presentation-01` with two lines of text in the secondary
// tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "presentation-02",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    "..#......#",
    "..#.oooo.#",
    "..#......#",
    "..#.ooo..#",
    "..#......#",
    "..########",
    ".....##",
    "....#..#",
    "...#....#",
  ],
};

export default icon;
