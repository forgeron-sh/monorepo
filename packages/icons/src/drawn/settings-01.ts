import type { PixelIcon } from "../types";

// Cog, 12×12: a two-pixel rim around a large hub hole, eight one-pixel teeth set at 22.5° so the
// notches fall on the diagonals and every gap is at least two pixels wide. Monotone only: a cog
// has no second idea to mark. Redrawn on 2026-11-16 by the protocol of docs/icons.md (the eight
// solid teeth and thick body before it read as a heavy blob).
// Proportions after Hugeicons `settings-01` (Iconify preview, 2026-11-16): a ring and a hub hole of
// about a third of the body; redrawn as pixel art, not traced.
const icon: PixelIcon = {
  name: "settings-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "...##..##",
    "...######",
    "..########",
    "####....####",
    "###......###",
    ".##......##",
    ".##......##",
    "###......###",
    "####....####",
    "..########",
    "...######",
    "...##..##",
  ],
};

export default icon;
