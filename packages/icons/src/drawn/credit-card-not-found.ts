import type { PixelIcon } from "../types";

// Card of `credit-card` with a question-mark badge.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "credit-card-not-found",
  implemented: true,
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
    ".#.###..ooo",
    ".#.........o",
    ".#####...oo",
    "",
    ".........o",
  ],
};

export default icon;
