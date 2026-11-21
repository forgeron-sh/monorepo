import type { PixelIcon } from "../types";

// Scratch card: a card whose panel is half scratched off, the scratch coating in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "scratch-card",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".##########",
    ".#........#",
    ".#.oooooo.#",
    ".#.oooo...#",
    ".#.oo.....#",
    ".#........#",
    ".#........#",
    ".##########",
  ],
};

export default icon;
