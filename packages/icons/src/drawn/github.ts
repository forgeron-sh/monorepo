import type { PixelIcon } from "../types";

// The GitHub mark in pixels, 16×16: the round disc with the Octocat cut out of it, its two ears,
// its wide head, the tail curling in on the lower left and the body that runs out at the bottom
// edge. On 12×12 the ears and the tail fall below one pixel and the mark reads as a ring with a
// hole (tried on 2026-11-17), so it takes the brand-mark grid of 16, like `cloudflare`.
// Rasterised from the reference `simple-icons:github` (Iconify, 2026-11-17) at cell centres, then
// redrawn by hand: the ears made two pixels tall (one-pixel notches were lost at 16 px next to
// the reference), the rim thinned to two rows above them, the head made symmetric, the tail kept
// as a two-pixel arm separated from the rim by a one-pixel gap. Monotone: the mark has no second
// tone. GitHub and the Octocat logo are trademarks of GitHub, Inc., used here only to refer to
// GitHub.
const icon: PixelIcon = {
  name: "github",
  implemented: true,
  style: "pixel",
  grid: 16,
  // prettier-ignore
  rows: [
    ".....######",
    "...##########",
    "..##.######.##",
    ".###..####..###",
    ".###........###",
    "###..........###",
    "###..........###",
    "###..........###",
    "###..........###",
    "###..........###",
    "####........####",
    ".####......####",
    ".##.##....#####",
    "..##......####",
    "...###....###",
    "....##....##",
  ],
};

export default icon;
