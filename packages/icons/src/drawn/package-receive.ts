import type { PixelIcon } from "../types";

// Parcel of `package` with a down arrow badge in the shared lower-right corner.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "package-receive",
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
    ".#......o.#",
    ".#......o",
    ".#....o.o.o",
    ".#.....ooo",
    ".#####..o",
  ],
};

export default icon;
