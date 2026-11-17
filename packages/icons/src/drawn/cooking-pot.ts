import type { PixelIcon } from "../types";

// Cooking pot: a lid with its knob over a pot with two handles.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "cooking-pot",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".....##",
    "...######",
    ".##########",
    ".#........#",
    "##........##",
    ".#........#",
    ".#........#",
    ".#........#",
    "..########",
  ],
};

export default icon;
