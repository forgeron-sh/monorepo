import type { PixelIcon } from "../types";

// Waveform: a line that swings up and down, wider each time.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "audio-waveform",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "....#",
    "...#.#",
    "...#.#....#",
    "##.#.#...#.#",
    "..#...#..#.#",
    "......#..#",
    ".......##",
  ],
};

export default icon;
