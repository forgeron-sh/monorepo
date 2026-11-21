import type { PixelIcon } from "../types";

// Handshake with a heart: `handshake` under a small heart in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "heart-handshake",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....oo.oo",
    "....ooooo",
    ".....ooo",
    "......o",
    "",
    "#.####.....#",
    "#.#####.##.#",
    "#.####.###.#",
    "#.###.####.#",
    "#....#####.#",
    "......#.#",
  ],
};

export default icon;
