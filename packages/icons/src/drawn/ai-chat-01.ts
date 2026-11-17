import type { PixelIcon } from "../types";

// Speech bubble with an AI sparkle badge: `message-01` one column left, the sparkle in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "ai-chat-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".########",
    "#........#",
    "#........#",
    "#........#",
    "#........#",
    "#",
    ".#..##...o",
    ".#.#....ooo",
    ".##....ooooo",
    "........ooo",
    ".........o",
  ],
};

export default icon;
