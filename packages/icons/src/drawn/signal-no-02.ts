import type { PixelIcon } from "../types";

// No signal: the wedge of `signal-full-02` all unlit in the secondary tone, with the cross of `signal-no-01`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "signal-no-02",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "#..#......o",
    ".##......oo",
    ".##.....ooo",
    "#..#...oooo",
    "......ooooo",
    ".....oooooo",
    "....ooooooo",
    "...oooooooo",
    "..ooooooooo",
    ".oooooooooo",
  ],
};

export default icon;
