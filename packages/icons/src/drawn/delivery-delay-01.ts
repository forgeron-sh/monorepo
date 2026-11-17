import type { PixelIcon } from "../types";

// A parcel and a clock badge: late delivery.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "delivery-delay-01",
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
    ".#.....ooo",
    ".#....o.o.o",
    ".#....o.ooo",
    ".#....o...o",
    ".#####.ooo",
  ],
};

export default icon;
