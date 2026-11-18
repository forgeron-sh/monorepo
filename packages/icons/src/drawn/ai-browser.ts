import type { PixelIcon } from "../types";

// Browser window with an AI sparkle badge: a frame with its title bar, one column left, the sparkle in
// the secondary tone at the lower right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "ai-browser",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "##########",
    "#........#",
    "##########",
    "#........#",
    "#........#",
    "#",
    "#........o",
    "#.......ooo",
    "#......ooooo",
    "######..ooo",
    ".........o",
  ],
};

export default icon;
