import type { PixelIcon } from "../types";

// A shuttlecock: feathered cone on a round cork.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "badminton-shuttle",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".#...##...#",
    ".#...##...#",
    "..#..##..#",
    "..#..##..#",
    "...#.##.#",
    "...#.##.#",
    "....####",
    "....oooo",
    "....oooo",
    ".....oo",
  ],
};

export default icon;
