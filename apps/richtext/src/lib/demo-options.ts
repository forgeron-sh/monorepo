// Fake providers for the demos: people, pages and tags to reference, an upload that takes a few
// seconds (with progress) or fails, an embed that resolves a URL. Nothing leaves the page. Written
// to cover plugins that do not exist yet: options are matched by the *name* the plugin's
// `PluginDoc.options` give them, and a name that matches nothing gets no value (the plugin then
// behaves as it does without the option).

import type { MentionItem, ReferenceProvider } from "@forgeron/richtext";

const PEOPLE: MentionItem[] = [
  { id: "ada", label: "Ada Lovelace", hint: "ada@example.com" },
  { id: "grace", label: "Grace Hopper", hint: "grace@example.com" },
  { id: "alan", label: "Alan Turing", hint: "alan@example.com" },
  { id: "margaret", label: "Margaret Hamilton", hint: "margaret@example.com" },
];

const PAGES: MentionItem[] = [
  { id: "p1", label: "Roadmap", hint: "Planning" },
  { id: "p2", label: "Release notes", hint: "Docs" },
  { id: "p3", label: "Onboarding", hint: "Team" },
  { id: "p4", label: "Incident review", hint: "Ops" },
];

const TAGS: MentionItem[] = [
  { id: "t1", label: "design" },
  { id: "t2", label: "bug" },
  { id: "t3", label: "idea" },
  { id: "t4", label: "later" },
];

const search = (list: MentionItem[]) => (query: string) => {
  const q = query.trim().toLowerCase();
  return list.filter((i) => i.label.toLowerCase().includes(q)).slice(0, 6);
};

/** What a page of the app would give to `<RichTextEditor references>`: people, pages and tags. */
const referenceProviders: ReferenceProvider[] = [
  { kind: "page", char: "#", label: "Pages", empty: "No page", items: search(PAGES) },
  { kind: "tag", char: "~", label: "Tags", empty: "No tag", items: search(TAGS) },
];

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

interface FakeUpload {
  url: string;
  src: string;
  name: string;
  size: number;
  type: string;
}

/**
 * A timer-based upload: reports progress (0 to 1) through whichever callback it is given (a second
 * argument that is a function, or `onProgress` of an options object), takes about two seconds, and
 * answers with a local object URL so a picture shows. It honours an abort signal. `failing` makes
 * it reject at 60%.
 */
function fakeUpload(failing: boolean) {
  return async (file: File, second?: unknown): Promise<FakeUpload> => {
    const given = second as { onProgress?: (n: number) => void; signal?: AbortSignal } | undefined;
    const report =
      typeof second === "function"
        ? (second as (n: number) => void)
        : (given?.onProgress ?? (() => {}));
    const steps = 10;
    for (let i = 1; i <= steps; i++) {
      await wait(200);
      if (given?.signal?.aborted) throw new DOMException("Upload cancelled", "AbortError");
      report(i / steps);
      if (failing && i === 6) throw new Error("Upload failed (simulated)");
    }
    const url = URL.createObjectURL(file);
    return { url, src: url, name: file.name, size: file.size, type: file.type };
  };
}

/** Resolves a pasted link to a title, a description and a picture, after a short wait. */
async function fakeResolveEmbed(link: string) {
  await wait(300);
  let host = "example.com";
  try {
    host = new URL(link).hostname;
  } catch {
    // Not a URL: keep the placeholder host.
  }
  return {
    url: link,
    title: `A page on ${host}`,
    provider: host,
    description: "Resolved by a fake provider: nothing was fetched.",
  };
}

export interface DemoSetup {
  /** `pluginOptions` for the editor: one object per plugin that has options to give. */
  pluginOptions: Record<string, unknown>;
  mentions: MentionItem[];
  references: ReferenceProvider[];
  requestImage: () => Promise<{ src: string; alt?: string } | null>;
}

interface DocLike {
  id: string;
  options?: ReadonlyArray<{ name: string }>;
}

/** An option value for a name, or `undefined` when the name says nothing we can fake. `owner` is the plugin id. */
function valueFor(name: string, owner: string, failing: boolean): unknown {
  if (/upload/i.test(name)) return fakeUpload(failing);
  if (/embed|unfurl|preview|oembed/i.test(name)) return fakeResolveEmbed;
  if (/^href$/i.test(name)) return (ref: { kind: string; id: string }) => `#${ref.kind}-${ref.id}`;
  if (/people|users|mentions/i.test(name)) return PEOPLE;
  if (/^pages$/i.test(name)) return search(PAGES);
  if (/^tags$/i.test(name)) return search(TAGS);
  if (/^(search|query|find|source|items|suggest)/i.test(name)) {
    if (/tag/i.test(owner)) return search(TAGS);
    if (/page/i.test(owner)) return search(PAGES);
    return search([...PAGES, ...TAGS]);
  }
  return undefined;
}

/**
 * Where an option lives: a name written `pluginOptions.<plugin>.<name>` is the option `<name>` of
 * the plugin `<plugin>`; a plain name is an option of the plugin that documents it.
 */
function target(doc: DocLike, written: string): { plugin: string; leaf: string } {
  const m = /^pluginOptions\.([^.]+)\.(.+)$/.exec(written);
  return m ? { plugin: m[1]!, leaf: m[2]! } : { plugin: doc.id, leaf: written };
}

/** The options object of a plugin factory (`pagesEditor({ search })`), from the options its doc lists. */
export function factoryOptions(doc: DocLike | undefined): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const option of doc?.options ?? []) {
    const { leaf } = target(doc as DocLike, option.name);
    const value = valueFor(leaf, doc?.id ?? "", false);
    if (value !== undefined) out[leaf] = value;
  }
  return out;
}

/** The setup for an editor: fake providers for every option any documented plugin lists. */
export function demoSetup(docs: ReadonlyArray<DocLike>, failing = false): DemoSetup {
  const pluginOptions: Record<string, Record<string, unknown>> = {};
  for (const doc of docs) {
    for (const option of doc.options ?? []) {
      const { plugin, leaf } = target(doc, option.name);
      const value = valueFor(leaf, plugin, failing);
      if (value !== undefined) (pluginOptions[plugin] ??= {})[leaf] = value;
    }
  }
  return {
    pluginOptions,
    mentions: PEOPLE,
    references: referenceProviders,
    requestImage: async () => ({ src: "/favicon.svg", alt: "Forgeron" }),
  };
}

/** Does any of these docs ask for an upload? Then the demo offers the working/failing switch. */
export const needsUpload = (docs: ReadonlyArray<DocLike>): boolean =>
  docs.some((d) => d.options?.some((o) => /upload/i.test(target(d, o.name).leaf)));

/** Plugins a family needs beside it to show anything: a file block without an upload cannot take a drop. */
export const FAMILY_COMPANIONS: Readonly<Record<string, ReadonlyArray<string>>> = {
  attachments: ["upload"],
};
