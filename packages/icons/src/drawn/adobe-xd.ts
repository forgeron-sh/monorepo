import type { PixelIcon } from "../types";

// The Adobe XD mark in pixels: the letters “Xd” cut out of a rounded square.
// 12×12: `#` primary tone. Rasterised from `simple-icons:adobexd` (Iconify, 2026-11-18), then redrawn by hand. Drawn on 2026-11-18.
// Adobe XD and the Adobe XD logo are trademarks of Adobe Inc., used here only to refer to Adobe XD.
const icon: PixelIcon = {
  name: "adobe-xd",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".##########",
    "############",
    "############",
    "############",
    "##.#.###.###",
    "##.#.###.###",
    "###.##...###",
    "##.#.#.#.###",
    "##.#.#...###",
    "############",
    "############",
    ".##########",
  ],
};

export default icon;
