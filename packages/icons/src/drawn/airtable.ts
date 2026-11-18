import type { PixelIcon } from "../types";

// The Airtable mark, 16×16: a flat rhombus on top, a parallelogram with 1:2 edges on the lower
// right and a smaller triangle on the lower left. Rasterised from `simple-icons:airtable`
// (Iconify, 2026-11-17), then redrawn with clean 2:1 slopes. Monotone.
const icon: PixelIcon = {
  name: "airtable",
  style: "pixel",
  grid: 16,
  // prettier-ignore
  rows: [
    "",
    "......####",
    "....########",
    "..############",
    "....########",
    "......####",
    ".##............#",
    ".####........###",
    ".######....#####",
    ".#######.#######",
    ".#####...#######",
    ".###.....#######",
    ".#.......#######",
    ".........######",
    ".........####",
    ".........##",
  ],
};

export default icon;
