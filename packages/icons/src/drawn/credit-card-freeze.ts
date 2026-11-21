import type { PixelIcon } from "../types";

// Card of `credit-card` with a snowflake badge.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "credit-card-freeze",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".##########",
    ".#........#",
    ".#oooooooo#",
    ".#oooooooo#",
    ".#",
    ".#.###.o.o.o",
    ".#......ooo",
    ".#####...o",
    "........ooo",
    ".......o.o.o",
  ],
};

export default icon;
