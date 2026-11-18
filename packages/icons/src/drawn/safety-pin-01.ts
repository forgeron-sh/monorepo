import type { PixelIcon } from "../types";

// Safety pin lying flat: the coil on the left, two wires, the clasp holding the point on the right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "safety-pin-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    ".##......###",
    "#..#######.#",
    "#..#.....###",
    ".#########",
  ],
};

export default icon;
