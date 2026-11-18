import type { PixelIcon } from "../types";

// Cog, 12×12: a two-pixel rim around a large hub hole, eight one-pixel teeth set at 22.5° so the
// notches fall on the diagonals and every gap is at least two pixels wide. Monotone only: a cog
// has no second idea to mark. Redrawn on 2026-11-16 by the protocol of docs/icons.md (the eight
// solid teeth and thick body before it read as a heavy blob).
// A ring and a hub hole of about a third of the body.
const icon: PixelIcon = {
  name: "settings-01",
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
