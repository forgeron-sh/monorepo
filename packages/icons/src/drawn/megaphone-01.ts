import type { PixelIcon } from "../types";

// Megaphone: a mouthpiece box, a cone opening to the right, a handle, sound in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "megaphone-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".........#",
    "........##",
    ".......#.#",
    ".######..#.o",
    ".#....#..#.o",
    ".#....#..#.o",
    ".######..#.o",
    "...##..#.#",
    "...##...##",
    ".........#",
  ],
};

export default icon;
