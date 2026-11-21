import { describe, expect, it } from "vitest";
import {
  type CorePlugin,
  type RichDoc,
  type RichNode,
  createRegistry,
  doc,
  fromMarkdown,
  normalizeDoc,
  paragraph,
  toHtml,
  toMarkdown,
  toPlainText,
  toTree,
} from "../index";
import { attachmentsDocs } from "./docs/attachments";
import {
  attachment,
  blockForFile,
  fileKind,
  formatFileSize,
  kindTitle,
  matchesAccept,
  parseKindTitle,
} from "./attachment";
import { attachmentsCorePlugins, embed, hostOf } from "./embed";
import { fullCorePlugins } from "./index";
import { audio, video } from "./media";

const plugins: CorePlugin[] = [...fullCorePlugins, ...attachmentsCorePlugins];

const file = (attrs: Record<string, unknown>): RichNode => ({ type: "attachment", attrs });
const roundTrip = (d: RichDoc) =>
  normalizeDoc(fromMarkdown(toMarkdown(d, plugins), plugins), plugins);

describe("file helpers", () => {
  it("formats sizes like the file input of the kit", () => {
    expect(formatFileSize(0)).toBe("0 B");
    expect(formatFileSize(12)).toBe("12 B");
    expect(formatFileSize(1024)).toBe("1 KB");
    expect(formatFileSize(1536)).toBe("1.5 KB");
    expect(formatFileSize(310 * 1024)).toBe("310 KB");
    expect(formatFileSize(2.4 * 1024 * 1024)).toBe("2.4 MB");
    expect(formatFileSize(-1)).toBe("");
    expect(formatFileSize(Number.NaN)).toBe("");
  });

  it("matches an accept list by extension, exact type and wildcard", () => {
    const pdf = { name: "Report.PDF", type: "application/pdf" };
    expect(matchesAccept(pdf, "")).toBe(true);
    expect(matchesAccept(pdf, undefined)).toBe(true);
    expect(matchesAccept(pdf, ".pdf")).toBe(true);
    expect(matchesAccept(pdf, "image/*, application/pdf")).toBe(true);
    expect(matchesAccept(pdf, "image/*")).toBe(false);
    expect(matchesAccept({ name: "a.png", type: "image/png" }, "image/*")).toBe(true);
    expect(matchesAccept({ name: "a.png", type: "image/png" }, ".jpg,.gif")).toBe(false);
  });

  it("tells the kind of a file from its type, then its extension", () => {
    expect(fileKind("a", "application/pdf")).toBe("pdf");
    expect(fileKind("a.zip", "")).toBe("archive");
    expect(fileKind("a.xlsx", "")).toBe("sheet");
    expect(fileKind("deck.pptx", "")).toBe("slides");
    expect(fileKind("a.png", "")).toBe("image");
    expect(fileKind("notes", "text/plain")).toBe("text");
    expect(fileKind(undefined, undefined)).toBe("file");
    expect(fileKind("mystery.zzz", "application/x-unknown")).toBe("file");
  });

  it("chooses the block by MIME type", () => {
    expect(blockForFile({ type: "image/png" })).toBe("image");
    expect(blockForFile({ type: "audio/mpeg" })).toBe("audio");
    expect(blockForFile({ type: "video/mp4" })).toBe("video");
    expect(blockForFile({ type: "application/pdf" })).toBe("attachment");
    expect(blockForFile({ name: "x" })).toBe("attachment");
  });

  it("writes and reads the title of a link block", () => {
    const title = kindTitle("attachment", { size: 2048, type: "application/pdf", empty: "" });
    expect(title).toBe("attachment size=2048 type=application%2Fpdf");
    expect(parseKindTitle(title)).toEqual({
      kind: "attachment",
      fields: { size: "2048", type: "application/pdf" },
    });
    expect(parseKindTitle("a nice tooltip")).toBeUndefined();
    expect(parseKindTitle("attachments")).toBeUndefined();
  });

  it("names the host of an address", () => {
    expect(hostOf("https://www.example.com/a?b#c")).toBe("example.com");
    expect(hostOf("https://user:pw@docs.example.org:8080/x")).toBe("docs.example.org:8080");
    expect(hostOf("/relative/path")).toBe("/relative/path");
  });
});

describe("the plugins of the family", () => {
  it("compose with the full preset, add their slash entries and own their node types", () => {
    const registry = createRegistry(plugins);
    for (const type of ["attachment", "audio", "video", "embed"]) {
      expect(registry.node(type)).toBeDefined();
    }
    expect(registry.blocks.map((b) => b.id)).toEqual(
      expect.arrayContaining(["file", "audio", "video", "embed", "image"]),
    );
    expect(registry.blocks.find((b) => b.id === "file")?.label).toBe("File");
    expect(registry.blocks.find((b) => b.id === "audio")?.label).toBe("Audio");
    expect(registry.blocks.find((b) => b.id === "video")?.label).toBe("Video");
  });

  it("are not in the full preset", () => {
    const ids = fullCorePlugins.map((p) => p.id);
    for (const id of ["upload", "attachment", "audio", "video", "embed"]) {
      expect(ids).not.toContain(id);
    }
    expect(attachmentsCorePlugins.map((p) => p.id)).toEqual([
      "upload",
      "attachment",
      "audio",
      "video",
      "embed",
    ]);
  });

  it("can be picked one by one", () => {
    const only = [attachment];
    const d = doc(file({ src: "/a.pdf", name: "a.pdf" }), {
      type: "audio",
      attrs: { src: "/a.mp3" },
    });
    expect(toPlainText(d, {}, only)).toContain("a.pdf");
    // The audio plugin is not in the list: it degrades to nothing, never crashes.
    expect(() => toHtml(d, only)).not.toThrow();
  });
});

describe("attachment", () => {
  const full = file({
    src: "https://files.example/report.pdf",
    name: "report.pdf",
    size: 2048,
    type: "application/pdf",
  });

  it("writes a link whose title names the block, and reads it back", () => {
    const md = toMarkdown(doc(full), plugins);
    expect(md).toBe(
      '[report.pdf](https://files.example/report.pdf "attachment size=2048 type=application%2Fpdf")',
    );
    expect(roundTrip(doc(full))).toEqual(normalizeDoc(doc(full), plugins));
  });

  it("round-trips names and addresses that need escaping", () => {
    const tricky = file({
      src: "https://files.example/a b/(draft) [1].pdf?x=1&y=2",
      name: "Q3 [draft] (final) *v2*.pdf",
      size: 0,
    });
    expect(roundTrip(doc(tricky))).toEqual(normalizeDoc(doc(tricky), plugins));
  });

  it("round-trips without size and type, and a name taken from the address", () => {
    const bare = file({ src: "/files/notes.txt", name: "notes.txt" });
    expect(toMarkdown(doc(bare), plugins)).toBe('[notes.txt](/files/notes.txt "attachment")');
    expect(roundTrip(doc(bare))).toEqual(normalizeDoc(doc(bare), plugins));
    const noName = file({ src: "/files/My%20Notes.txt" });
    expect(toPlainText(doc(noName), {}, plugins)).toBe("My Notes.txt");
    expect(fromMarkdown('[](/files/a.bin "attachment")', plugins).content[0]?.attrs?.["name"]).toBe(
      "a.bin",
    );
  });

  it("degrades to an ordinary link in a reader that does not know the family", () => {
    const md = toMarkdown(doc(full), plugins);
    // Without the plugin the line is a paragraph holding a plain link, title kept as a tooltip.
    const read = fromMarkdown(md, fullCorePlugins);
    const first = read.content[0] as RichNode;
    expect(first.type).toBe("paragraph");
    expect(toPlainText(read, {}, fullCorePlugins)).toBe("report.pdf");
    // And with the family, a title that is just prose stays a link in a paragraph.
    const prose = fromMarkdown('[a](https://x.example "a tooltip")', plugins);
    expect(prose.content[0]?.type).toBe("paragraph");
  });

  it("does not take a link in a sentence for a block", () => {
    const read = fromMarkdown('See [a.pdf](/a.pdf "attachment") now', plugins);
    expect(read.content[0]?.type).toBe("paragraph");
  });

  it("writes the name as plain text", () => {
    expect(toPlainText(doc(paragraph("Before"), full, paragraph("After")), {}, plugins)).toBe(
      "Before\nreport.pdf\nAfter",
    );
  });

  it("is shown as a card with a download link and its size", () => {
    const html = toHtml(doc(full), plugins);
    expect(html).toContain('class="fg-rt-file"');
    expect(html).toContain('data-kind="pdf"');
    expect(html).toContain('href="https://files.example/report.pdf"');
    expect(html).toContain('download="report.pdf"');
    expect(html).toContain("2 KB");
    expect(html).toContain("PDF");
  });

  it("links nothing unsafe but keeps the card", () => {
    for (const src of [
      "javascript:alert(1)",
      "data:text/html;base64,AAAA",
      "//evil.example/x",
      "vbscript:x",
    ]) {
      const html = toHtml(doc(file({ src, name: "x.bin" })), plugins);
      expect(html).not.toContain("href=");
      expect(html).not.toContain("javascript:");
      expect(html).toContain("x.bin");
    }
    expect(toHtml(doc(file({ src: "mailto:a@example.com", name: "m" })), plugins)).toContain(
      "mailto:",
    );
    expect(toHtml(doc(file({ src: "../up/a.pdf", name: "a.pdf" })), plugins)).toContain(
      'href="../up/a.pdf"',
    );
  });

  it("escapes what it shows", () => {
    const html = toHtml(doc(file({ src: "/a", name: '<img src=x onerror="1">' })), plugins);
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;img");
  });

  it("survives missing and wrong fields", () => {
    const cases: RichNode[] = [
      { type: "attachment" },
      file({}),
      file({ src: 12, name: null, size: "big", type: false }),
      file({ size: -5, name: "n" }),
      file({ src: "", name: "  " }),
    ];
    for (const node of cases) {
      expect(() => toMarkdown(doc(node), plugins)).not.toThrow();
      expect(() => toPlainText(doc(node), {}, plugins)).not.toThrow();
      expect(() => toHtml(doc(node), plugins)).not.toThrow();
      expect(() => normalizeDoc(doc(node), plugins)).not.toThrow();
    }
    expect(toTree(doc({ type: "attachment" }), plugins)).toEqual([]);
    expect(toMarkdown(doc({ type: "attachment" }), plugins)).toBe("");
    expect(toHtml(doc(file({ name: "only a name" })), plugins)).toContain("only a name");
    expect(toMarkdown(doc(file({ name: "only a name" })), plugins)).toBe("only a name");
    expect(toHtml(doc(file({ src: "/a", name: "n", size: "big" })), plugins)).not.toContain(
      "fg-rt-file-size",
    );
    expect(toHtml(doc(file({ src: "/a", name: "n", size: "2048" })), plugins)).toContain("2 KB");
  });

  it("is an unknown block, kept as text, when its plugin is not in the list", () => {
    const html = toHtml(doc(full), fullCorePlugins);
    expect(html).toContain("Unsupported block (attachment)");
    expect(toPlainText(doc(full), {}, fullCorePlugins)).toBe("");
  });
});

describe("audio and video", () => {
  const sound: RichNode = {
    type: "audio",
    attrs: { src: "https://files.example/a b.mp3", title: "Interview [raw]" },
  };
  const clip: RichNode = {
    type: "video",
    attrs: { src: "/media/demo.mp4", title: "Demo", poster: "https://files.example/p.jpg?a=1&b=2" },
  };

  it("round-trip through Markdown", () => {
    for (const node of [sound, clip, { type: "audio", attrs: { src: "/a.mp3" } }]) {
      expect(roundTrip(doc(node))).toEqual(normalizeDoc(doc(node), plugins));
    }
    expect(toMarkdown(doc(clip), plugins)).toBe(
      '[Demo](/media/demo.mp4 "video poster=https%3A%2F%2Ffiles.example%2Fp.jpg%3Fa%3D1%26b%3D2")',
    );
  });

  it("write the title, or the file name, as plain text", () => {
    expect(toPlainText(doc(sound, clip), {}, plugins)).toBe("Interview [raw]\nDemo");
    expect(
      toPlainText(doc({ type: "video", attrs: { src: "/m/clip%201.mp4" } }), {}, plugins),
    ).toBe("clip 1.mp4");
  });

  it("are shown with controls, a caption and a poster", () => {
    const html = toHtml(doc(sound, clip), plugins);
    expect(html).toContain("<audio");
    expect(html).toContain(" controls");
    expect(html).toContain("<video");
    expect(html).toContain('poster="https://files.example/p.jpg?a=1&amp;b=2"');
    expect(html).toContain("<figcaption>Demo</figcaption>");
  });

  it("drop an unsafe source and an unsafe poster", () => {
    expect(
      toHtml(doc({ type: "audio", attrs: { src: "javascript:alert(1)" } }), plugins),
    ).not.toContain("<audio");
    const html = toHtml(
      doc({ type: "video", attrs: { src: "/v.mp4", poster: "javascript:alert(1)" } }),
      plugins,
    );
    expect(html).toContain("<video");
    expect(html).not.toContain("poster");
    expect(
      toHtml(
        doc({ type: "video", attrs: { src: "/v.mp4", poster: "data:text/html;base64,AA" } }),
        plugins,
      ),
    ).not.toContain("poster");
  });

  it("survive missing fields", () => {
    for (const type of ["audio", "video"]) {
      for (const attrs of [undefined, {}, { src: null }, { src: 3 }, { src: "  " }]) {
        const node: RichNode = attrs ? { type, attrs } : { type };
        expect(toHtml(doc(node), plugins)).not.toContain(`<${type}`);
        expect(toMarkdown(doc(node), plugins)).toBe("");
        expect(toPlainText(doc(node), {}, plugins)).toBe("");
      }
    }
  });

  it("are read only by the plugin that owns them", () => {
    const md = toMarkdown(doc(sound, clip), plugins);
    const onlyAudio = fromMarkdown(md, [...fullCorePlugins, audio]);
    expect(onlyAudio.content.map((n) => n.type)).toEqual(["audio", "paragraph"]);
    const onlyVideo = fromMarkdown(md, [...fullCorePlugins, video]);
    expect(onlyVideo.content.map((n) => n.type)).toEqual(["paragraph", "video"]);
  });
});

describe("embed", () => {
  const card: RichNode = {
    type: "embed",
    attrs: {
      url: "https://www.example.com/post?id=1&x=(2)",
      title: "A [post] title",
      description: "It says: a, b & c.",
      image: "https://cdn.example.com/card.png",
    },
  };

  it("round-trips through Markdown, with and without a preview", () => {
    for (const node of [
      card,
      { type: "embed", attrs: { url: "https://example.com" } },
      { type: "embed", attrs: { url: "/relative", title: "T" } },
    ]) {
      expect(roundTrip(doc(node))).toEqual(normalizeDoc(doc(node), plugins));
    }
    expect(toMarkdown(doc({ type: "embed", attrs: { url: "https://example.com" } }), plugins)).toBe(
      '[https://example.com](https://example.com "embed")',
    );
  });

  it("writes its title, else its address, as plain text", () => {
    expect(toPlainText(doc(card), {}, plugins)).toBe("A [post] title");
    expect(
      toPlainText(doc({ type: "embed", attrs: { url: "https://example.com" } }), {}, plugins),
    ).toBe("https://example.com");
  });

  it("is a bookmark card with a link, a picture and the host", () => {
    const html = toHtml(doc(card), plugins);
    expect(html).toContain('class="fg-rt-embed"');
    expect(html).toContain('href="https://www.example.com/post?id=1&amp;x=(2)"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain("A [post] title");
    expect(html).toContain("It says: a, b &amp; c.");
    expect(html).toContain('src="https://cdn.example.com/card.png"');
    expect(html).toContain(">example.com<");
  });

  it("links only safe addresses and shows only safe pictures", () => {
    for (const url of [
      "javascript:alert(1)",
      "data:text/html,x",
      "//evil.example",
      "file:///etc/passwd",
    ]) {
      const html = toHtml(doc({ type: "embed", attrs: { url, title: "T" } }), plugins);
      expect(html).not.toContain("href=");
      expect(html).toContain("T");
    }
    const html = toHtml(
      doc({ type: "embed", attrs: { url: "https://example.com", image: "javascript:alert(1)" } }),
      plugins,
    );
    expect(html).not.toContain("<img");
    expect(
      toHtml(doc({ type: "embed", attrs: { url: "mailto:a@example.com" } }), plugins),
    ).toContain('href="mailto:a@example.com"');
    expect(toHtml(doc({ type: "embed", attrs: { url: "/docs/page" } }), plugins)).toContain(
      'href="/docs/page"',
    );
  });

  it("survives missing fields", () => {
    for (const attrs of [undefined, {}, { url: null }, { url: 7 }, { url: " " }, { title: "x" }]) {
      const node: RichNode = attrs ? { type: "embed", attrs } : { type: "embed" };
      expect(toHtml(doc(node), plugins)).not.toContain("fg-rt-embed");
      expect(toMarkdown(doc(node), plugins)).toBe("");
      expect(toPlainText(doc(node), {}, plugins)).toBe("");
    }
    expect(embed.id).toBe("embed");
  });
});

describe("the documentation", () => {
  it("has an entry per plugin, every field filled", () => {
    expect(attachmentsDocs.map((d) => d.id)).toEqual([
      "upload",
      "attachment",
      "audio",
      "video",
      "embed",
    ]);
    const ids = new Set(attachmentsCorePlugins.map((p) => p.id));
    for (const entry of attachmentsDocs) {
      expect(ids.has(entry.id)).toBe(true);
      expect(entry.family).toBe("attachments");
      expect(entry.name.length).toBeGreaterThan(2);
      for (const field of [entry.summary, entry.core, entry.editor, entry.usage]) {
        expect(field.trim().length).toBeGreaterThan(10);
      }
      expect(entry.core).toMatch(/^@forgeron\/richtext\/plugins\/[a-z-]+$/);
      expect(entry.editor).toMatch(/^@forgeron\/richtext\/plugins\/editor\/[a-z-]+$/);
      expect(entry.options?.length).toBeGreaterThan(0);
      expect(entry.notes?.length).toBeGreaterThan(0);
      expect(entry.id === "upload" || (entry.markdown?.length ?? 0) > 0).toBe(true);
    }
  });

  it("shows Markdown samples that its plugins read", () => {
    for (const entry of attachmentsDocs.filter((d) => d.markdown)) {
      const read = fromMarkdown(entry.markdown as string, plugins);
      expect(read.content[0]?.type).toBe(entry.id);
    }
  });
});
