import type { PixelIcon } from "../types";

// Card of `credit-card` with a badge of two linked rings: link a card.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "credit-card-link",
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
    ".#.###...ooo",
    ".#.....ooo.o",
    ".#####.o.ooo",
    ".......ooo",
  ],
};

export default icon;
