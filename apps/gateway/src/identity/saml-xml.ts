// A small, strict XML reader and the exclusive canonicalization (xml-exc-c14n, no comments) that an
// XML signature is computed over (D-049). It exists only for SAML: no DOCTYPE, no entity other than the
// five predefined ones and character references, no processing instruction inside an element, bounded
// size and depth. Anything else is refused, never skipped. No DOM, no `node:*`: it runs in a Worker.

export class XmlError extends Error {
  override name = "XmlError";
}

interface XmlAttribute {
  prefix: string;
  local: string;
  ns: string;
  value: string;
}

export interface XmlElement {
  prefix: string;
  local: string;
  /** The namespace URI, `""` when none. */
  ns: string;
  /** Attributes other than namespace declarations. */
  attributes: XmlAttribute[];
  /** The namespace declarations of this element: prefix (`""` for the default) to URI. */
  declarations: Map<string, string>;
  /** Child elements and text; adjacent text (and CDATA) is one string, comments are dropped. */
  children: Array<XmlElement | string>;
  parent: XmlElement | undefined;
}

const XML_NS = "http://www.w3.org/XML/1998/namespace";
const MAX_BYTES = 1_000_000;
const MAX_DEPTH = 64;
const MAX_ELEMENTS = 20_000;
const NAME = /^[A-Za-z_][A-Za-z0-9_.-]*(?::[A-Za-z_][A-Za-z0-9_.-]*)?$/;
const PREDEFINED: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };

function decode(raw: string): string {
  return raw.replace(/&(#x[0-9A-Fa-f]+|#[0-9]+|[A-Za-z]+);/g, (_, ref: string) => {
    if (ref.startsWith("#")) {
      const code = ref[1] === "x" ? parseInt(ref.slice(2), 16) : parseInt(ref.slice(1), 10);
      const valid =
        code === 9 ||
        code === 10 ||
        code === 13 ||
        (code >= 0x20 && code <= 0xd7ff) ||
        (code >= 0xe000 && code <= 0xfffd) ||
        (code >= 0x10000 && code <= 0x10ffff);
      if (!valid) throw new XmlError("A character reference is not a valid XML character.");
      return String.fromCodePoint(code);
    }
    const found = PREDEFINED[ref];
    if (found === undefined) throw new XmlError(`The entity &${ref}; is not allowed.`);
    return found;
  });
}

const split = (name: string): [string, string] => {
  const colon = name.indexOf(":");
  return colon < 0 ? ["", name] : [name.slice(0, colon), name.slice(colon + 1)];
};

/** The namespace URI a prefix stands for at `element`; `undefined` if undeclared. */
function lookup(element: XmlElement | undefined, prefix: string): string | undefined {
  if (prefix === "xml") return XML_NS;
  for (let e = element; e; e = e.parent) {
    const found = e.declarations.get(prefix);
    if (found !== undefined) return found;
  }
  return prefix === "" ? "" : undefined;
}

/** Parses a document. Throws `XmlError` on anything malformed or not allowed. */
export function parseXml(input: string): XmlElement {
  if (input.length > MAX_BYTES) throw new XmlError("The document is too large.");
  // XML line-end normalization.
  const text = input.replace(/^﻿/, "").replace(/\r\n?/g, "\n");
  let i = 0;
  let count = 0;
  let root: XmlElement | undefined;

  const fail = (message: string): never => {
    throw new XmlError(message);
  };
  const skipSpace = () => {
    while (i < text.length && " \t\n".includes(text[i]!)) i++;
  };
  // Comments and (outside the root) processing instructions; a DOCTYPE or anything else with `<!` is refused.
  const skipMisc = (insideElement: boolean) => {
    for (;;) {
      if (text.startsWith("<!--", i)) {
        const end = text.indexOf("-->", i + 4);
        if (end < 0) fail("A comment is not closed.");
        if (text.slice(i + 4, end).includes("--")) fail("A comment contains `--`.");
        i = end + 3;
      } else if (text.startsWith("<?", i)) {
        if (insideElement) fail("A processing instruction inside an element is not allowed.");
        const end = text.indexOf("?>", i + 2);
        if (end < 0) fail("A processing instruction is not closed.");
        i = end + 2;
      } else return;
    }
  };

  const readElement = (parent: XmlElement | undefined, depth: number): XmlElement => {
    if (depth > MAX_DEPTH) fail("The document is nested too deeply.");
    if (++count > MAX_ELEMENTS) fail("The document has too many elements.");
    i++; // `<`
    const nameEnd = /^[^\s/>]+/.exec(text.slice(i));
    const qname = nameEnd?.[0] ?? "";
    if (!NAME.test(qname)) fail("An element name is not valid.");
    i += qname.length;
    const raw: Array<[string, string]> = [];
    for (;;) {
      const before = i;
      skipSpace();
      if (text[i] === ">" || text.startsWith("/>", i)) break;
      if (i === before) fail("An attribute must follow a space.");
      const match = /^([^\s=/>]+)\s*=\s*(["'])/.exec(text.slice(i));
      if (!match || !NAME.test(match[1]!)) return fail("An attribute is not valid.");
      i += match[0].length;
      const end = text.indexOf(match[2]!, i);
      if (end < 0) fail("An attribute value is not closed.");
      const value = text.slice(i, end);
      if (value.includes("<")) fail("An attribute value contains `<`.");
      i = end + 1;
      // Attribute-value normalization: a literal tab or line feed is a space; references are kept.
      raw.push([match[1]!, decode(value.replace(/[\t\n]/g, " "))]);
    }
    const element: XmlElement = {
      prefix: "",
      local: "",
      ns: "",
      attributes: [],
      declarations: new Map(),
      children: [],
      parent,
    };
    for (const [name, value] of raw) {
      if (name === "xmlns" || name.startsWith("xmlns:")) {
        const prefix = name === "xmlns" ? "" : name.slice(6);
        if (element.declarations.has(prefix)) fail("A namespace is declared twice.");
        if (prefix !== "" && value === "") fail("A prefix is bound to an empty namespace.");
        if (prefix === "xmlns" || (prefix === "xml" && value !== XML_NS)) {
          fail("A reserved prefix is redeclared.");
        }
        element.declarations.set(prefix, value);
      }
    }
    const [prefix, local] = split(qname);
    const ns = lookup(element, prefix);
    if (ns === undefined) fail(`The prefix ${prefix} is not declared.`);
    element.prefix = prefix;
    element.local = local;
    element.ns = ns!;
    const seen = new Set<string>();
    for (const [name, value] of raw) {
      if (name === "xmlns" || name.startsWith("xmlns:")) continue;
      const [attrPrefix, attrLocal] = split(name);
      const attrNs = attrPrefix === "" ? "" : lookup(element, attrPrefix);
      if (attrNs === undefined) return fail(`The prefix ${attrPrefix} is not declared.`);
      const key = `${attrNs}\u0000${attrLocal}`;
      if (seen.has(key)) fail("An attribute appears twice.");
      seen.add(key);
      element.attributes.push({ prefix: attrPrefix, local: attrLocal, ns: attrNs, value });
    }
    if (text.startsWith("/>", i)) {
      i += 2;
      return element;
    }
    i++; // `>`
    let buffer = "";
    const flush = () => {
      if (buffer !== "") element.children.push(buffer);
      buffer = "";
    };
    for (;;) {
      if (i >= text.length) fail(`The element ${qname} is not closed.`);
      if (text.startsWith("</", i)) {
        const end = text.indexOf(">", i);
        if (end < 0 || text.slice(i + 2, end).trim() !== qname)
          fail("A closing tag does not match.");
        i = end + 1;
        flush();
        return element;
      }
      if (text.startsWith("<![CDATA[", i)) {
        const end = text.indexOf("]]>", i + 9);
        if (end < 0) fail("A CDATA section is not closed.");
        buffer += text.slice(i + 9, end);
        i = end + 3;
      } else if (text.startsWith("<!--", i) || text.startsWith("<?", i)) {
        skipMisc(true);
      } else if (text.startsWith("<!", i)) {
        fail("A DOCTYPE or declaration is not allowed.");
      } else if (text[i] === "<") {
        flush();
        element.children.push(readElement(element, depth + 1));
      } else {
        const next = text.indexOf("<", i);
        const chunk = text.slice(i, next < 0 ? text.length : next);
        if (chunk.includes("]]>")) fail("Text contains `]]>`.");
        buffer += decode(chunk);
        i += chunk.length;
      }
    }
  };

  if (text.startsWith("<?xml", i) && /^<\?xml\s/.test(text.slice(i, i + 7))) {
    const end = text.indexOf("?>", i);
    if (end < 0) fail("The XML declaration is not closed.");
    i = end + 2;
  }
  for (;;) {
    skipSpace();
    skipMisc(false);
    if (text.startsWith("<!", i)) fail("A DOCTYPE or declaration is not allowed.");
    if (i >= text.length) break;
    if (text[i] !== "<") fail("Text outside the root element.");
    if (root) fail("More than one root element.");
    root = readElement(undefined, 0);
  }
  if (!root) fail("The document is empty.");
  return root!;
}

const escapeText = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\r/g, "&#xD;");
const escapeAttribute = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;")
    .replace(/\t/g, "&#x9;")
    .replace(/\n/g, "&#xA;")
    .replace(/\r/g, "&#xD;");

const compare = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

/**
 * Exclusive canonical XML 1.0 without comments, of `element` in its document. `omit` is an element
 * left out (the enveloped signature itself); `inclusive` is the `PrefixList` of an
 * `InclusiveNamespaces` parameter (`#default` stands for the default namespace).
 */
export function canonicalize(
  element: XmlElement,
  options: { omit?: XmlElement; inclusive?: string[] } = {},
): string {
  const forced = new Set((options.inclusive ?? []).map((p) => (p === "#default" ? "" : p)));
  const walk = (el: XmlElement, rendered: Map<string, string>): string => {
    const utilized = new Set<string>([el.prefix]);
    for (const a of el.attributes)
      if (a.prefix !== "" && a.prefix !== "xml") utilized.add(a.prefix);
    for (const p of forced) if (lookup(el, p) !== undefined) utilized.add(p);
    const declare: Array<[string, string]> = [];
    const here = new Map(rendered);
    for (const prefix of [...utilized].filter((p) => p !== "xml").sort(compare)) {
      const uri = lookup(el, prefix) ?? "";
      const before = rendered.get(prefix);
      const same = before === undefined ? prefix === "" && uri === "" : before === uri;
      if (same) continue;
      declare.push([prefix, uri]);
      here.set(prefix, uri);
    }
    const qname = (p: string, l: string) => (p === "" ? l : `${p}:${l}`);
    let out = `<${qname(el.prefix, el.local)}`;
    for (const [prefix, uri] of declare) {
      out += ` ${prefix === "" ? "xmlns" : `xmlns:${prefix}`}="${escapeAttribute(uri)}"`;
    }
    const attributes = [...el.attributes].sort(
      (a, b) => compare(a.ns, b.ns) || compare(a.local, b.local),
    );
    for (const a of attributes) {
      out += ` ${qname(a.prefix, a.local)}="${escapeAttribute(a.value)}"`;
    }
    out += ">";
    for (const child of el.children) {
      if (typeof child === "string") out += escapeText(child);
      else if (child !== options.omit) out += walk(child, here);
    }
    return `${out}</${qname(el.prefix, el.local)}>`;
  };
  // What an ancestor of the apex element would have rendered: nothing, as in the specification.
  return walk(element, new Map());
}

/** The child elements of `element` with this namespace and local name. */
export function childrenNamed(element: XmlElement, ns: string, local: string): XmlElement[] {
  return element.children.filter(
    (c): c is XmlElement => typeof c !== "string" && c.ns === ns && c.local === local,
  );
}

/** The text of an element made of text only; `undefined` if it has child elements. */
export function textOf(element: XmlElement): string | undefined {
  return element.children.every((c) => typeof c === "string")
    ? (element.children as string[]).join("")
    : undefined;
}

/** An attribute without a namespace. */
export function attribute(element: XmlElement, name: string): string | undefined {
  return element.attributes.find((a) => a.ns === "" && a.local === name)?.value;
}

/** Every element of the subtree, the element included. */
export function* descendants(element: XmlElement): Generator<XmlElement> {
  yield element;
  for (const child of element.children) if (typeof child !== "string") yield* descendants(child);
}
