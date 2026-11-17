import type { PixelIcon } from "../types";

// Arrow entering a square bracket from the left: sign in.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "login-square-02",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "......#####",
    "..........#",
    "....oo....#",
    ".....oo...#",
    ".ooooooo..#",
    ".ooooooo..#",
    ".....oo...#",
    "....oo....#",
    "..........#",
    "......#####",
  ],
};

export default icon;
