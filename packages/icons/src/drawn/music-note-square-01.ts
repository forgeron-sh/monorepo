import type { PixelIcon } from "../types";

// Music note in a box, the note in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "music-note-square-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#........#",
    ".#....oo..#",
    ".#....o.o.#",
    ".#....o...#",
    ".#....o...#",
    ".#..ooo...#",
    ".#..oo....#",
    ".#........#",
    "..########",
  ],
};

export default icon;
