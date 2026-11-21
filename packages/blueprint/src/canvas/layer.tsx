// <BlueprintLayer>: the Blueprint items of a <Canvas>, drawn by the engine (docs/blueprint/engine.md
// §3, "On @forgeron/canvas"). It goes in the canvas's `layers.below`, inside the world transform,
// and undoes that transform so its one canvas sits in screen space: the pictures land on whole
// screen pixels at an integer scale, never resampled by CSS. The canvas viewport never reaches the
// engine: the layer turns it into raster sizes and placements (`BlueprintStage`).

import { useCanvasContext } from "@forgeron/canvas/react";
import type { Item } from "@forgeron/canvas";
import { useEffect, useRef } from "react";
import { type BlueprintItemData, isBlueprintItem } from "./kind";
import type { BlueprintStage, HoverHit } from "./stage";

export interface BlueprintLayerProps {
  /** The stage that holds the scenes (`new BlueprintStage({ resolve })`); the layer attaches it. */
  stage: BlueprintStage;
  /** The tag under the pointer changed (`null`: nothing, or the pointer left). */
  onHover?: (hit: HoverHit | null) => void;
}

const sameHit = (a: HoverHit | null, b: HoverHit | null) =>
  a === b || (a !== null && b !== null && a.item === b.item && a.tag === b.tag);

export function BlueprintLayer({ stage, onHover }: BlueprintLayerProps) {
  const store = useCanvasContext<unknown>();
  const ref = useRef<HTMLCanvasElement>(null);
  const hoverRef = useRef(onHover);
  useEffect(() => {
    hoverRef.current = onHover;
  }, [onHover]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    stage.attach(canvas);
    let items: unknown = null;
    let last: HoverHit | null = null;
    const sync = () => {
      const s = store.getState();
      const v = s.viewport;
      // Undo the world transform: this canvas's pixel (x, y) is the surface's pixel (x, y).
      canvas.style.transform = `scale(${1 / v.zoom}) translate(${-v.x}px, ${-v.y}px)`;
      canvas.style.width = `${s.size.w}px`;
      canvas.style.height = `${s.size.h}px`;
      if (s.items !== items) {
        items = s.items;
        const list: Item<BlueprintItemData>[] = [];
        for (const item of s.items)
          if (isBlueprintItem(item as Item<unknown>)) list.push(item as Item<BlueprintItemData>);
        stage.setItems(list);
      }
      stage.setViewport(v, s.size);
    };
    sync();
    const stop = store.subscribe(sync);

    // The pointer is the surface's, whose events reach the root of <Canvas>.
    const root = canvas.closest(".fg-canvas") as HTMLElement | null;
    const move = (e: PointerEvent) => {
      const r = root!.getBoundingClientRect();
      const hit = stage.hover({ x: e.clientX - r.left, y: e.clientY - r.top });
      if (!sameHit(hit, last)) {
        last = hit;
        hoverRef.current?.(hit);
      }
    };
    const leave = () => {
      stage.hover(null);
      if (last !== null) {
        last = null;
        hoverRef.current?.(null);
      }
    };
    root?.addEventListener("pointermove", move);
    root?.addEventListener("pointerleave", leave);

    // A theme switch changes the tokens the palette comes from.
    const doc = canvas.ownerDocument;
    const themes =
      typeof MutationObserver === "undefined"
        ? null
        : new MutationObserver(() => stage.readPalette());
    themes?.observe(doc.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme", "class"],
    });

    return () => {
      stop();
      themes?.disconnect();
      root?.removeEventListener("pointermove", move);
      root?.removeEventListener("pointerleave", leave);
    };
  }, [stage, store]);

  return (
    <canvas
      ref={ref}
      className="fg-bp-layer"
      aria-hidden="true"
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        transformOrigin: "0 0",
        imageRendering: "pixelated",
        pointerEvents: "none",
      }}
    />
  );
}
