import type { PixelIcon } from "../types";

// Square speech bubble with a bot's eyes and mouth in the secondary tone; the face is the subject.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "bot-message-square",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#........#",
    ".#.oo..oo.#",
    ".#.oo..oo.#",
    ".#........#",
    ".#..oooo..#",
    ".#........#",
    ".##.#######",
    ".#.#",
    ".##",
  ],
};

export default icon;
