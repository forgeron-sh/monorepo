import type { PixelIcon } from "../types";

// Wallpaper: the monitor of `computer` showing a picture with a sun in the secondary tone and two peaks.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "wallpaper",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#.....oo.#",
    ".#.....oo.#",
    ".#...#....#",
    ".#..###.#.#",
    ".#.########",
    ".##########",
    ".....##",
    ".....##",
    "...######",
  ],
};

export default icon;
