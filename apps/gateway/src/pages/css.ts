import tokens from "../../../../assets/design-system/tokens.json";

// The page shell's stylesheet, generated from `assets/design-system/tokens.json` when the module
// loads (the same source as `packages/ui/tokens/tokens.css`): no file to keep in step, no request.
// The brand fonts are named first and fall back to the system stacks: nothing is downloaded.

type Theme = "dark" | "light";

const variables = (theme: Theme) =>
  tokens.color.tokens.map((t) => `--${t.name}:${t.value[theme]}`).join(";");

const spacing = tokens.spacing.tokens.map((t) => `--${t.name}:${t.value}`).join(";");
const families = Object.entries(tokens.type.families)
  .map(([name, stack]) => `--font-${name}:${stack}`)
  .join(";");

const LAYOUT = `
*,*::before,*::after{box-sizing:border-box;border-radius:0}
html{-webkit-text-size-adjust:100%}
body{margin:0;min-height:100vh;min-height:100dvh;display:flex;flex-direction:column;background:var(--bg);color:var(--ink);font:400 14px/22px var(--font-sans);-webkit-font-smoothing:antialiased}
a{color:var(--ink);text-underline-offset:3px;text-decoration-thickness:1px}
a:hover{text-decoration-thickness:2px}
:focus-visible{outline:2px solid var(--focus);outline-offset:2px}
code,kbd,.mono{font:400 12.5px/20px var(--font-mono)}
header.bar{display:flex;align-items:center;justify-content:space-between;gap:var(--space-4);padding:var(--space-6) var(--space-6) 0;max-width:calc(420px + 2 * var(--space-6));width:100%;margin:0 auto}
.brand{display:inline-flex;align-items:center;gap:var(--space-2);color:var(--ink);text-decoration:none;font:600 18px/1 var(--font-display);letter-spacing:-.02em}
.brand svg{display:block}
.where{font:500 12px/16px var(--font-mono);color:var(--ink-muted);overflow-wrap:anywhere;text-align:right}
main{flex:1;display:flex;flex-direction:column;justify-content:center;width:100%;max-width:calc(420px + 2 * var(--space-6));margin:0 auto;padding:var(--space-8) var(--space-6)}
.card{position:relative;background:var(--surface-raised);border:1px solid var(--line);border-top:2px solid var(--ink);padding:var(--space-6)}
.eyebrow{margin:0 0 var(--space-2);font:500 12px/16px var(--font-mono);letter-spacing:.06em;text-transform:uppercase;color:var(--ink-muted)}
h1{margin:0 0 var(--space-3);font:600 28px/34px var(--font-display);letter-spacing:-.02em;overflow-wrap:anywhere}
.card>p{margin:0 0 var(--space-4)}
.lead{color:var(--ink-muted)}
.muted{color:var(--ink-muted)}
small,.small{font-size:13px;line-height:20px}
form{margin:0}
.stack>*+*{margin-top:var(--space-4)}
label{display:block;font:500 14px/22px var(--font-sans);margin-bottom:var(--space-1)}
.hint{display:block;margin-top:var(--space-1);font:400 13px/20px var(--font-sans);color:var(--ink-muted)}
input{display:block;width:100%;height:32px;padding:0 var(--space-3);background:var(--bg);color:var(--ink);border:1px solid var(--line-strong);font:400 14px/22px var(--font-sans);transition:background-color 120ms,border-color 120ms}
input::placeholder{color:var(--ink-muted)}
input:hover{border-color:var(--ink-muted)}
input[readonly]{background:var(--surface-sunken);font-family:var(--font-mono);font-size:13px}
input.code{height:48px;font:500 24px/32px var(--font-mono);letter-spacing:.28em;text-align:center;padding-left:calc(var(--space-3) + .28em)}
.btn{display:inline-flex;align-items:center;justify-content:center;width:100%;height:32px;padding:0 var(--space-3);border:1px solid var(--line-strong);background:transparent;color:var(--ink);font:500 14px/22px var(--font-sans);text-decoration:none;cursor:pointer;transition:background-color 120ms,border-color 120ms}
.btn:hover{background:var(--surface-hover);text-decoration:none}
.btn.primary{background:var(--inverse);border-color:var(--inverse);color:var(--on-inverse)}
.btn.primary:hover{background:var(--inverse);opacity:.88}
.btn.link{width:auto;border:0;height:auto;padding:0;background:none;text-decoration:underline;text-underline-offset:3px;text-decoration-thickness:1px;font-weight:400}
.actions{display:flex;gap:var(--space-3)}
.actions>*{flex:1}
.links{display:flex;justify-content:space-between;flex-wrap:wrap;gap:var(--space-1) var(--space-4)}
.links a,.links .btn.link{padding:var(--space-2) 0}
.divider{display:flex;align-items:center;gap:var(--space-3);margin:var(--space-4) 0;color:var(--ink-muted);font:500 12px/16px var(--font-mono);text-transform:uppercase;letter-spacing:.06em}
.divider::before,.divider::after{content:"";flex:1;border-top:1px solid var(--line)}
.notice{display:flex;gap:var(--space-3);align-items:baseline;margin:0 0 var(--space-4);padding:var(--space-3);border:1px solid var(--line);background:var(--surface)}
.notice .tag{flex:none;font:500 12px/16px var(--font-mono);letter-spacing:.06em;text-transform:uppercase}
.notice.danger{background:var(--danger-subtle);border-color:var(--danger)}
.notice.danger .tag{color:var(--danger)}
.notice.warning{background:var(--warning-subtle);border-color:var(--warning)}
.notice.warning .tag{color:var(--warning)}
.notice.success{background:var(--success-subtle);border-color:var(--success)}
.notice.success .tag{color:var(--success)}
dl.facts{margin:0 0 var(--space-4);border-top:1px solid var(--line)}
dl.facts>div{display:flex;justify-content:space-between;gap:var(--space-4);padding:var(--space-2) 0;border-bottom:1px solid var(--line)}
dl.facts dt{color:var(--ink-muted);flex:none}
dl.facts dd{margin:0;text-align:right;overflow-wrap:anywhere;font:500 13px/22px var(--font-mono)}
.secret+.secret{margin-top:var(--space-4)}
.tag-set{display:inline-block;margin-left:var(--space-2);padding:0 var(--space-2);border:1px solid var(--line-strong);font:500 12px/16px var(--font-mono);text-transform:uppercase;letter-spacing:.06em;vertical-align:1px}
footer{max-width:calc(420px + 2 * var(--space-6));width:100%;margin:0 auto;padding:0 var(--space-6) var(--space-6);color:var(--ink-muted);font:400 12px/16px var(--font-mono);display:flex;justify-content:space-between;gap:var(--space-4);flex-wrap:wrap}
.anvil{position:fixed;right:-48px;bottom:-48px;width:320px;height:320px;color:var(--surface);pointer-events:none;z-index:-1}
@media (max-width:600px){
  header.bar{padding:var(--space-4) var(--space-4) 0}
  main{padding:var(--space-6) var(--space-4);justify-content:flex-start}
  footer{padding:0 var(--space-4) var(--space-4)}
  .card{padding:var(--space-4)}
  h1{font-size:24px;line-height:30px}
  input,.btn{height:40px}
  .actions{flex-direction:column-reverse}
  .anvil{width:200px;height:200px;right:-32px;bottom:-32px}
}
@media (prefers-reduced-motion:reduce){*{transition:none!important}}
`;

/** The whole stylesheet: Forge (dark) by default, Atelier (light) under `prefers-color-scheme`. */
export const stylesheet = (): string =>
  `:root{color-scheme:dark;${variables("dark")};${families};${spacing}}` +
  `@media (prefers-color-scheme:light){:root{color-scheme:light;${variables("light")}}}` +
  LAYOUT.replace(/\n\s*/g, "");
