import type { PixelIcon } from "../types";

// A bar of soap with bubbles.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "body-soap",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".......oo",
    "...oo.o..o",
    "...oo.o..o",
    ".......oo",
    "",
    "..########",
    ".#........#",
    ".#........#",
    ".#........#",
    "..########",
  ],
};

export default icon;
