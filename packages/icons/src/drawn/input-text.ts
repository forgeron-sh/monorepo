import type { PixelIcon } from "../types";

// Text input: a field with a letter and a text cursor in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "input-text",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".##########",
    "#..........#",
    "#...#......#",
    "#..#.#..o..#",
    "#..###..o..#",
    "#..#.#..o..#",
    "#..........#",
    ".##########",
  ],
};

export default icon;
