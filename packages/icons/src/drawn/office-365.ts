import type { PixelIcon } from "../types";

// The Office 365 mark in pixels, 12×12: the door-shaped "O" seen in perspective, a tall slab on
// the right whose top rises and bottom falls away to the right, joined by a sloping lintel and a
// floor to a short pillar on the left, with the doorway cut out between them. 12×12: the mark is
// almost square and reads on the base grid. Drawn on 2026-11-18. The Iconify reference was
// rate-limited that day, so the shape is redrawn by hand from the known logo, not rasterised.
// Monotone: the mark has one tone. Microsoft Office and the Office logo are trademarks of
// Microsoft Corporation, used here only to refer to Office 365.
const icon: PixelIcon = {
  name: "office-365",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "........##",
    "......####",
    "....######",
    "..####.###",
    "..##...###",
    "..##...###",
    "..##...###",
    "..##...###",
    "..##...###",
    "..########",
    "......####",
    "........##",
  ],
};

export default icon;
