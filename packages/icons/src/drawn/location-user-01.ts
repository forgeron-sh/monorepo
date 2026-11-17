import type { PixelIcon } from "../types";

// Location pin with a person: a person's location.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "location-user-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..####",
    ".#....#",
    ".#.##.#",
    ".#.##.#",
    "..#..#",
    "...##..ooo",
    ".......o.o",
    ".......ooo",
    "",
    "......ooooo",
  ],
};

export default icon;
