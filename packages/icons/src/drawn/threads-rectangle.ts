import type { PixelIcon } from "../types";

// The Threads mark in a rounded square: the looped at sign cut out of the filled square.
// 16×16: `#` primary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "threads-rectangle",
  style: "pixel",
  grid: 16,
  // prettier-ignore
  rows: [
    ".##############",
    "################",
    "#####......#####",
    "####.######.####",
    "###.########.###",
    "##.###....######",
    "##.###.##.######",
    "##.######.######",
    "##.###.....#####",
    "##.##.###.#.####",
    "##.##.###.##.###",
    "##.###...###.###",
    "###.#######.####",
    "####.......#####",
    "################",
    ".##############",
  ],
};

export default icon;
