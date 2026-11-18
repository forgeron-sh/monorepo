import type { PixelIcon } from "../types";

// A Poké Ball: the round ball of `circle`, its upper half solid, the lower half left open, and the
// round button in the middle of the seam, ringed by a one-pixel gap so it stays separate from the
// solid half. Monotone: the solid upper half stands for the red one, the open lower half for the
// white one.
// Pokémon and the Poké Ball are trademarks of Nintendo, Creatures Inc. and GAME FREAK inc., used
// here only to refer to Pokémon.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "pokeball",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....####",
    "..########",
    ".##########",
    ".##......##",
    "###.####.###",
    "###.#..#.###",
    "#...#..#...#",
    "#...####...#",
    ".#........#",
    ".#........#",
    "..##....##",
    "....####",
  ],
};

export default icon;
