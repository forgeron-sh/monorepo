import type { PixelIcon } from "../types";

// The front of a train in a tunnel arch. Train front after `train-01`, smaller.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "train-front-tunnel",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....oooo",
    "..oo....oo",
    ".o........o",
    ".o..####..o",
    ".o.#....#.o",
    ".o.######.o",
    ".o.#....#.o",
    ".o.##..##.o",
    ".o.######.o",
    ".o..#..#..o",
    ".o........o",
    ".o........o",
  ],
};

export default icon;
