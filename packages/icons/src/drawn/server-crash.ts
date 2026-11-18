import type { PixelIcon } from "../types";

// Server crash: the server-stack-01 top unit with a lightning bolt in the secondary tone below.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "server-crash",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#.##.....#",
    ".#.##.....#",
    ".##########",
    "",
    "......oo",
    ".....oo",
    "....oooo",
    "......oo",
    ".....oo",
    "....oo",
  ],
};

export default icon;
