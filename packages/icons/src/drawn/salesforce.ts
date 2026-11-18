import type { PixelIcon } from "../types";

// The Salesforce mark, 16×16: the cloud, two bumps on top with a dip between them, two smaller
// bumps below. Rasterised from `simple-icons:salesforce` (Iconify, 2026-11-17); the raster was a
// smooth blob without its bumps, so the cloud was redrawn by hand with one-pixel dips. Monotone.
const icon: PixelIcon = {
  name: "salesforce",
  style: "pixel",
  grid: 16,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    "....###...###",
    "...#####.#####",
    "..#############",
    ".###############",
    "################",
    "################",
    ".##############",
    "..############",
    "...####..####",
    "....##....##",
  ],
};

export default icon;
