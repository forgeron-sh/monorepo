import type { PixelIcon } from "../types";

// A tractor: cab, hood, exhaust, a big rear wheel and a small front wheel.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "tractor",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..####",
    "..#..#..#",
    "..#..#..#",
    "..#..#####",
    "..#......#",
    ".oooo....#",
    "o....o####",
    "o....o..oo",
    "o....o.o..o",
    "o....o.o..o",
    ".oooo...oo",
  ],
};

export default icon;
