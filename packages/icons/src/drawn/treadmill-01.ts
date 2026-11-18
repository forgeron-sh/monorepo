import type { PixelIcon } from "../types";

// A treadmill: a running belt with an upright and a console at the front.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "treadmill-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".......####",
    ".......#..#",
    ".......####",
    ".........#",
    ".........#",
    ".........#",
    ".........#",
    "..########",
    ".#oooooooo#",
    "..########",
  ],
};

export default icon;
