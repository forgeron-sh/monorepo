import os, math, shutil, cairosvg
import uharfbuzz as hb
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen

OUT = "/home/claude/forgeron-identite"
DARK, LIGHT = "#1C1C1C", "#FFFFFF"
FONT = "/usr/share/fonts/opentype/inter/InterDisplay-SemiBold.otf"
WORD = "forgeron"
TRACK = -0.035  # em

# --- Symbole : enclume, grille 132 x 132 -----------------------------------
S = 132.0
r_r, cy_r = 29.0, 71.0
cx_r = S - cy_r + r_r * math.sqrt(2)
tx, ty = cx_r - r_r / math.sqrt(2), cy_r - r_r / math.sqrt(2)
MARK = (f"M0 0H{S:g}L{tx:.3f} {ty:.3f}A{r_r:g} {r_r:g} 0 0 0 {cx_r:.3f} {cy_r + r_r:g}"
        f"H{S:g}V{S:g}H0V100A33 33 0 0 0 0 34Z")

def mark_path(x, y, size):
    k = size / S
    return f'<path transform="translate({x:.3f} {y:.3f}) scale({k:.6f})" d="{MARK}"/>'

# --- Wordmark vectorisé ----------------------------------------------------
tt = TTFont(FONT); gs = tt.getGlyphSet(); upem = tt["head"].unitsPerEm
cap = tt["OS/2"].sCapHeight; xh = tt["OS/2"].sxHeight
blob = hb.Blob.from_file_path(FONT); face = hb.Face(blob); font = hb.Font(face)
buf = hb.Buffer(); buf.add_str(WORD); buf.guess_segment_properties()
hb.shape(font, buf, {"kern": True, "liga": True})
order = tt.getGlyphOrder()

def word_path():
    """Chemin en unités font (y vers le haut converti en y vers le bas), bbox."""
    pen = SVGPathPen(gs); bp = BoundsPen(gs)
    x = 0; n = len(buf.glyph_infos)
    for i, (info, pos) in enumerate(zip(buf.glyph_infos, buf.glyph_positions)):
        name = order[info.codepoint]
        t = (1, 0, 0, -1, x + pos.x_offset, -pos.y_offset)
        gs[name].draw(TransformPen(pen, t)); gs[name].draw(TransformPen(bp, t))
        x += pos.x_advance + (TRACK * upem if i < n - 1 else 0)
    return pen.getCommands(), bp.bounds  # bounds: xmin, ymin(-asc), xmax, ymax(desc)

WD, WB = word_path()

def word_group(x, baseline, size_px):
    k = size_px / upem
    return f'<path transform="translate({x - WB[0]*k:.3f} {baseline:.3f}) scale({k:.6f})" d="{WD}"/>'

def word_metrics(size_px):
    k = size_px / upem
    return (WB[2] - WB[0]) * k, -WB[1] * k, WB[3] * k  # largeur, ascendante, descendante

# --- Gabarits --------------------------------------------------------------
def svg(w, h, body, bg, fg, title):
    rect = f'<rect width="{w:g}" height="{h:g}" fill="{bg}"/>' if bg else ""
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{w:g}" height="{h:g}" '
            f'viewBox="0 0 {w:g} {h:g}" role="img" aria-label="{title}"><title>{title}</title>'
            f'{rect}<g fill="{fg}">{body}</g></svg>\n')

def symbol(ratio, W=1024):
    size = W * ratio; o = (W - size) / 2
    return W, W, mark_path(o, o, size)

def lockup(H=400):
    m = H * 0.42                       # hauteur du symbole
    fs = m * 0.72 * upem / cap         # hauteur de capitale ~72 % du symbole
    k = fs / upem
    gap = m * 0.30
    ww, asc, desc = word_metrics(fs)
    pad = H * 0.29
    W = pad * 2 + m + gap + ww
    my = (H - m) / 2
    baseline = H / 2 + cap * k / 2     # centrage optique sur la hauteur de capitale
    return W, H, mark_path(pad, my, m) + word_group(pad + m + gap, baseline, fs)

def wordmark(H=400):
    fs = H * 0.30 * upem / cap
    k = fs / upem; ww, asc, desc = word_metrics(fs)
    pad = H * 0.29
    W = pad * 2 + ww
    baseline = H / 2 + cap * k / 2
    return W, H, word_group(pad, baseline, fs)

def tight(kind):
    """Sans fond, cadré au plus juste (transparent)."""
    if kind == "lockup":
        m = 132; fs = m * 0.72 * upem / cap; k = fs / upem; gap = m * 0.30
        ww, asc, desc = word_metrics(fs)
        top = min(0, m / 2 - cap * k / 2 - asc + cap * k * 0)  # ascendante du f
        baseline = m / 2 + cap * k / 2
        y0 = min(0, baseline - asc); y1 = max(m, baseline + desc)
        body = mark_path(0, -y0, m) + word_group(m + gap, baseline - y0, fs)
        return m + gap + ww, y1 - y0, body
    fs = 200; ww, asc, desc = word_metrics(fs)
    return ww, asc + desc, word_group(0, asc, fs)

# --- Export ----------------------------------------------------------------
def save(path, w, h, body, bg, fg, title, png_w):
    full = os.path.join(OUT, path)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    s = svg(w, h, body, bg, fg, title)
    open(full + ".svg", "w").write(s)
    cairosvg.svg2png(bytestring=s.encode(), write_to=full + ".png", output_width=png_w)

if os.path.exists(OUT): shutil.rmtree(OUT)
themes = {"sombre": (DARK, LIGHT), "clair": (LIGHT, DARK)}

framings = {"01-aere": 133 / 499, "02-standard": 0.60, "03-plein-cadre": 0.96}
for fname, ratio in framings.items():
    for t, (bg, fg) in themes.items():
        w, h, b = symbol(ratio)
        save(f"1-symbole/{fname}/forgeron-symbole-{fname[3:]}-{t}", w, h, b, bg, fg, "Forgeron", 1024)

for t, (bg, fg) in themes.items():
    w, h, b = lockup(); save(f"2-logo-horizontal/forgeron-logo-{t}", w, h, b, bg, fg, "Forgeron", 2400)
    w, h, b = wordmark(); save(f"3-wordmark/forgeron-wordmark-{t}", w, h, b, bg, fg, "Forgeron", 2400)

# Transparents (sans fond) pour intégration / dev
for col, fg in {"blanc": LIGHT, "noir": DARK}.items():
    save(f"4-transparent/forgeron-symbole-{col}", S, S, mark_path(0, 0, S), None, fg, "Forgeron", 1024)
    w, h, b = tight("lockup"); save(f"4-transparent/forgeron-logo-{col}", w, h, b, None, fg, "Forgeron", 2400)
    w, h, b = tight("word"); save(f"4-transparent/forgeron-wordmark-{col}", w, h, b, None, fg, "Forgeron", 2400)
print("ok")
