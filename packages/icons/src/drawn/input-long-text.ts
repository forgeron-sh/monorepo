import type { PixelIcon } from "../types";

// Long text input: a tall field with three lines of text.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "input-long-text",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    "#..........#",
    "#..oooooo..#",
    "#..........#",
    "#..oooooo..#",
    "#..........#",
    "#..oooo....#",
    "#..........#",
    "#..........#",
    ".##########",
  ],
};

export default icon;
