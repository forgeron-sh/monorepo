import type { PixelIcon } from "../types";

// Layers, 12×12: a solid top sheet and the edges of two sheets under it, the middle one in the
// secondary tone. Redrawn on 2026-11-16 by the protocol of docs/icons.md: the lab's `layers` (a
// one-pixel outline over two chevrons) blurred at 16 px.
const icon: PixelIcon = {
  name: "layers-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##",
    "...######",
    ".##########",
    "...######",
    ".....##",
    ".oo......oo",
    "...oo..oo",
    ".....oo",
    ".##......##",
    "...##..##",
    ".....##",
  ],
};

export default icon;
