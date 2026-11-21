import type { PixelIcon } from "../types";

// Body armour: a sleeveless vest with straps and a V neck, two plates in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "body-armor",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..##....##",
    "..#.#..#.#",
    ".#...##...#",
    ".#........#",
    ".#.oooooo.#",
    ".#........#",
    ".#.oooooo.#",
    ".#........#",
    ".#........#",
    ".##########",
  ],
};

export default icon;
