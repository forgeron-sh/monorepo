import type { IconRenderOptions, PixelIcon } from "@forgeron/icons";
import { toSvg } from "@forgeron/icons";
import { Icon } from "@forgeron/icons/react";
import { type ReactNode, useEffect, useRef, useState } from "react";

// The review sheet of `docs/icons.md`: each icon at the sizes it must read at (16, 24, 48 px), on
// dark and light, in both tones, and as a screen at 1 device pixel per CSS pixel would show it.

export interface ReviewItem {
  /** Unique key and the name shown. */
  readonly id: string;
  readonly icon: PixelIcon;
  /** A line under the name: what the drawing tries, or why it is here. */
  readonly note?: string;
}

const SIZES = [16, 24, 48] as const;
const INK = "#ededed";
const EMBER = "#ff4f1f";
const PAPER_INK = "#111111";

/**
 * The icon drawn on a canvas of `size × density` device pixels, as a screen of that density draws
 * it, then shown `zoom` CSS pixels per canvas pixel without smoothing. With density 1 and zoom 1 on
 * a 2× screen, each pixel of a 1× screen becomes a 2×2 block, so what a 1× monitor shows (the
 * uneven pixels of a 12-pixel grid at 16 px, say) is visible here. A larger zoom is a loupe.
 */
function Raster({
  icon,
  size,
  options,
  density = 1,
  zoom = 1,
}: {
  icon: PixelIcon;
  size: number;
  options: IconRenderOptions;
  density?: number;
  zoom?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const px = size * density;
  const svg = toSvg(icon, { ...options, size: px });
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !svg) return;
    const image = new Image();
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    let live = true;
    image
      .decode()
      .then(() => {
        const ctx = live ? canvas.getContext("2d") : null;
        if (!ctx) return;
        ctx.clearRect(0, 0, px, px);
        ctx.drawImage(image, 0, 0, px, px);
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [svg, px]);
  const css = (px * zoom) / (zoom === 1 ? density : 1);
  return (
    <canvas
      ref={ref}
      width={px}
      height={px}
      className="raster"
      style={{ width: css, height: css }}
    />
  );
}

function Cell({ children, label }: { children: ReactNode; label: string }) {
  return (
    <span className="rv-cell">
      {children}
      <span className="t-mono dim">{label}</span>
    </span>
  );
}

function Row({ item, loupe }: { item: ReviewItem; loupe: boolean }) {
  const { icon } = item;
  const duo: IconRenderOptions = {
    variant: "duo",
    color: INK,
    secondaryColor: EMBER,
    secondaryOpacity: 1,
  };
  const mono: IconRenderOptions = { variant: "mono", color: INK };
  const paper: IconRenderOptions = { variant: "mono", color: PAPER_INK };
  return (
    <li className="rv-row">
      <div className="rv-id">
        <span className="t-code">{item.id}</span>
        <span className="t-mono dim">
          {icon.grid}×{icon.grid}
        </span>
        {item.note ? <span className="t-small muted">{item.note}</span> : null}
      </div>
      <div className="rv-group rv-dark">
        {SIZES.map((px) => (
          <Cell key={`d${px}`} label={`duo ${px}`}>
            <Icon icon={icon} {...duo} size={px} />
          </Cell>
        ))}
        {SIZES.map((px) => (
          <Cell key={`m${px}`} label={`mono ${px}`}>
            <Icon icon={icon} {...mono} size={px} />
          </Cell>
        ))}
      </div>
      <div className="rv-group rv-dark">
        {SIZES.slice(0, 2).map((px) => (
          <Cell key={`x${px}`} label={`1× ${px}`}>
            <Raster icon={icon} size={px} options={duo} />
          </Cell>
        ))}
      </div>
      <div className="rv-group rv-light">
        {SIZES.map((px) => (
          <Cell key={`l${px}`} label={`light ${px}`}>
            <Icon icon={icon} {...paper} size={px} />
          </Cell>
        ))}
      </div>
      {loupe ? (
        <div className="rv-group rv-dark rv-loupe">
          {[2, 1].flatMap((density) =>
            SIZES.slice(0, 2).map((px) => (
              <Cell key={`z${density}-${px}`} label={`${density}× ${px} · loupe`}>
                <Raster icon={icon} size={px} options={duo} density={density} zoom={3} />
              </Cell>
            )),
          )}
        </div>
      ) : null}
    </li>
  );
}

/**
 * `?only=a,b` keeps the items whose id is listed; `?loupe=1` adds the enlarged device pixels. The
 * sheet is rendered in the browser only (`client:only`), so the address is read once, at render.
 */
function readParams(): { only: Set<string> | null; loupe: boolean } {
  const search = new URLSearchParams(window.location.search);
  const raw = search.get("only");
  return {
    only: raw ? new Set(raw.split(",").filter(Boolean)) : null,
    loupe: search.get("loupe") === "1",
  };
}

export default function Review({ items }: { items: readonly ReviewItem[] }) {
  const [{ only, loupe }] = useState(readParams);
  const shown = only ? items.filter((item) => only.has(item.id)) : items;
  return (
    <ul className="rv">
      {shown.map((item) => (
        <Row key={item.id} item={item} loupe={loupe} />
      ))}
    </ul>
  );
}
