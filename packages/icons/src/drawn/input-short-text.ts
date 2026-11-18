import type { PixelIcon } from "../types";

// Short text input: a field with a short line of text and a cursor in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "input-short-text",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".##########",
    "#..........#",
    "#.......o..#",
    "#.......o..#",
    "#..####.o..#",
    "#.......o..#",
    "#..........#",
    ".##########",
  ],
};

export default icon;
