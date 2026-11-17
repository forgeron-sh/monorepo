import type { PixelIcon } from "../types";

// Card of `credit-card` with a water-drop badge: the ice has melted.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "credit-card-defrost",
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
    ".#.###...o",
    ".#......ooo",
    ".#####.ooooo",
    ".......ooooo",
    "........ooo",
  ],
};

export default icon;
