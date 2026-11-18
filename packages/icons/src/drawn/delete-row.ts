import type { PixelIcon } from "../types";

// Two table rows, the lower one marked with a minus in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "delete-row",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".##########",
    ".#........#",
    ".#........#",
    ".#........#",
    ".##########",
    "",
    ".##########",
    ".#........#",
    ".#.oooooo.#",
    ".#........#",
    ".##########",
  ],
};

export default icon;
