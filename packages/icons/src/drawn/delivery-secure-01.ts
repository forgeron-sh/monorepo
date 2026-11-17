import type { PixelIcon } from "../types";

// A parcel and a shield badge: insured delivery.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "delivery-secure-01",
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
    ".#....ooooo",
    ".#....o...o",
    ".#....o...o",
    ".#.....o.o",
    ".#####..o",
  ],
};

export default icon;
