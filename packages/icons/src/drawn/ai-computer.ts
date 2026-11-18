import type { PixelIcon } from "../types";

// Monitor with an AI sparkle badge: `computer` one column left, the sparkle in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "ai-computer",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "##########",
    "#........#",
    "#........#",
    "#........#",
    "#........#",
    "#",
    "######...o",
    "....##..ooo",
    "....##.ooooo",
    "..####..ooo",
    ".........o",
  ],
};

export default icon;
