import type { PixelIcon } from "../types";

// Notepad bound at the top with three lines of text, in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "notepad-text",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "...#....#",
    ".##########",
    ".#.#....#.#",
    ".#........#",
    ".#.oooooo.#",
    ".#........#",
    ".#.oooooo.#",
    ".#........#",
    ".#.oooo...#",
    ".#........#",
    ".##########",
  ],
};

export default icon;
