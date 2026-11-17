import type { PixelIcon } from "../types";

// A parcel and an eye badge: track the delivery.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "delivery-view-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...########",
    "..#..##..##",
    ".########.#",
    ".#..##..#.#",
    ".#..##....#",
    ".#",
    ".#.....ooo",
    ".#....o.o.o",
    ".#.....ooo",
    ".#####",
  ],
};

export default icon;
