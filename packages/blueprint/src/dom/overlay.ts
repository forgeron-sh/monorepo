/**
 * The DOM overlay of a played scene (docs/blueprint/engine.md §3, "DOM overlay, accessibility
 * and input"): the canvas becomes an image named by the scene's title and description, and its
 * labels a visually hidden list beside it, so assistive technology reads what the pixels say.
 * Legends stay the page's own DOM, driven by `on("active")`.
 */

export interface OverlayContent {
  title?: string;
  description?: string;
  /** The label texts of the scene, in drawing order. */
  labels?: readonly string[];
}

export interface Overlay {
  update(content: OverlayContent): void;
  dispose(): void;
}

const HIDDEN =
  "position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0";

export function overlay(canvas: HTMLCanvasElement, initial: OverlayContent = {}): Overlay {
  const doc = canvas.ownerDocument;
  const before = {
    role: canvas.getAttribute("role"),
    label: canvas.getAttribute("aria-label"),
    describedby: canvas.getAttribute("aria-describedby"),
  };
  let list: HTMLUListElement | null = null;
  const id = `bp-overlay-${Math.random().toString(36).slice(2, 10)}`;

  const update = (c: OverlayContent) => {
    canvas.setAttribute("role", "img");
    const name = [c.title, c.description].filter(Boolean).join(". ");
    if (name) canvas.setAttribute("aria-label", name);
    const labels = c.labels ?? [];
    if (labels.length === 0) {
      list?.remove();
      list = null;
      canvas.removeAttribute("aria-describedby");
      return;
    }
    if (!list) {
      list = doc.createElement("ul");
      list.id = id;
      list.setAttribute("style", HIDDEN);
      canvas.insertAdjacentElement("afterend", list);
    }
    list.replaceChildren(
      ...labels.map((text) => {
        const li = doc.createElement("li");
        li.textContent = text;
        return li;
      }),
    );
    canvas.setAttribute("aria-describedby", id);
  };
  update(initial);

  return {
    update,
    dispose() {
      list?.remove();
      list = null;
      for (const [attr, v] of [
        ["role", before.role],
        ["aria-label", before.label],
        ["aria-describedby", before.describedby],
      ] as const)
        if (v === null) canvas.removeAttribute(attr);
        else canvas.setAttribute(attr, v);
    },
  };
}
