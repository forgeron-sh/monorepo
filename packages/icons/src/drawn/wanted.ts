import type { PixelIcon } from "../types";

// A wanted poster: a portrait under a heading bar in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "wanted",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".##########",
    ".#........#",
    ".#.oooooo.#",
    ".#........#",
    ".#...##...#",
    ".#...##...#",
    ".#..####..#",
    ".#..####..#",
    ".#........#",
    ".#.######.#",
    ".#........#",
    ".##########",
  ],
};

export default icon;
