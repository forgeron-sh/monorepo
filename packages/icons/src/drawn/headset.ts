import type { PixelIcon } from "../types";

// Headset: the band and ear cups of `headphones`, cups in the secondary tone, and a boom microphone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "headset",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#......#",
    ".#........#",
    ".#........#",
    ".ooo....ooo",
    ".ooo....ooo",
    ".ooo....ooo",
    ".ooo....ooo",
    ".........#",
    ".....#####",
  ],
};

export default icon;
