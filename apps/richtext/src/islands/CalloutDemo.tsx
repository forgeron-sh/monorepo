import { fromMarkdown, type RichDoc } from "@forgeron/richtext";
import { bold, bubble, heading, placeholder, slash } from "@forgeron/richtext/plugins/editor";
import { RichTextEditor } from "@forgeron/richtext/react";
import "@forgeron/richtext/styles.css";
import { useMemo, useState } from "react";
import { callout } from "../lib/callout";
import { Output } from "./shared";

const SEED = `# Your own plugin

:::callout
This box is not in the package: it is the plugin on this page.
:::

Type / and pick Callout.
`;

const plugins = [placeholder, bold, heading, callout, slash, bubble];

/** The plugin written on the "Use it" page, running in an editor. */
export default function CalloutDemo() {
  const cores = useMemo(() => plugins.map((p) => p.core), []);
  const [doc, setDoc] = useState<RichDoc>(() => fromMarkdown(SEED, cores));
  return (
    <div className="rt-stack">
      <div className="rt-box">
        <RichTextEditor
          value={doc}
          onChange={setDoc}
          plugins={plugins}
          placeholder="Type / for blocks"
          label="Editor with the callout plugin"
        />
      </div>
      <Output doc={doc} plugins={plugins} />
    </div>
  );
}
