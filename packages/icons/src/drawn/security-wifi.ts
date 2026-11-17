import type { PixelIcon } from "../types";

// Shield with Wi-Fi arcs over a dot in the secondary tone; the shield-plus base.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "security-wifi",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#........#",
    ".#..oooo..#",
    ".#.o....o.#",
    ".#...oo...#",
    ".#..o..o..#",
    "..#......#",
    "...#.oo.#",
    "....#..#",
    ".....##",
  ],
};

export default icon;
