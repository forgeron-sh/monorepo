import type { PixelIcon } from "../types";

// Bus from the front: a rounded roof, a solid windscreen in the secondary tone, two lights and two wheels.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "bus-02",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#........#",
    ".#oooooooo#",
    ".#oooooooo#",
    ".#........#",
    ".#........#",
    ".#.##..##.#",
    ".##########",
    ".##......##",
    ".##......##",
  ],
};

export default icon;
