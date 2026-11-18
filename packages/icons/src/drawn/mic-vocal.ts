import type { PixelIcon } from "../types";

// Handheld microphone: a round head and a handle on a 45° slope.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "mic-vocal",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".......###",
    "......#ooo#",
    "......#ooo#",
    "......#ooo#",
    "......##.##",
    ".....##..#",
    "....##.##",
    "...##.##",
    "..##.##",
    "..###",
  ],
};

export default icon;
