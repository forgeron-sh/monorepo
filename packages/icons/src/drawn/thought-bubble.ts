import type { PixelIcon } from "../types";

// Thought bubble: a round bubble trailed by two small circles.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "thought-bubble",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "...######",
    ".##......##",
    "#..........#",
    "#..........#",
    "#..........#",
    ".##......##",
    "...######",
    "",
    "...##",
    "...##",
    "",
    ".#",
  ],
};

export default icon;
