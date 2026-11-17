import type { PixelIcon } from "../types";

// Invoice with a plus badge: `invoice-01` one column left, the badge in the secondary tone at the lower
// right, the invoice cut back one pixel around it.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "add-invoice",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".########",
    ".#......#",
    ".#.####.#",
    ".#......#",
    ".#......#",
    ".#.###",
    ".#.......o",
    ".#.......o",
    ".#.#...ooooo",
    ".##.##...o",
    ".........o",
  ],
};

export default icon;
