import type { PixelIcon } from "../types";

// API gateway: a gate of two pillars under a beam, angle brackets in the secondary tone between them.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "api-gateway",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "############",
    ".#........#",
    ".#........#",
    ".#..o..o..#",
    ".#.o....o.#",
    ".#.o....o.#",
    ".#..o..o..#",
    ".#........#",
    ".#........#",
    "##........##",
  ],
};

export default icon;
