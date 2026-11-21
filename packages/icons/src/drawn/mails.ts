import type { PixelIcon } from "../types";

// Mails: an envelope in front of another, the one behind in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "mails",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...oooooooo",
    "...o......o",
    "...o......o",
    ".########.o",
    ".##....##.o",
    ".#.#..#.#.o",
    ".#..##..#",
    ".#......#",
    ".#......#",
    ".########",
  ],
};

export default icon;
