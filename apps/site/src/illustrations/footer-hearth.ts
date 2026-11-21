/**
 * The footer's hearth (`mountHearth` of @forgeron/shaders in Blueprint's pixel face), loaded by
 * `Footer.astro` when the footer comes near the screen (`whenNear`).
 */
import { glyph, glyphWidth, textWidth } from "@forgeron/blueprint";
import { mountHearth } from "@forgeron/shaders/dom";

export function mountFooterHearth(root: HTMLElement): void {
  mountHearth(root, { face: { glyph, glyphWidth, textWidth } });
}
