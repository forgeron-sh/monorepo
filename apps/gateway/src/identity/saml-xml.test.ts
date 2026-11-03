import { describe, expect, it } from "vitest";
import { XmlError, canonicalize, parseXml } from "./saml-xml";

describe("exclusive canonicalization", () => {
  it("renders a namespace where it is used, sorts attributes and expands empty elements", () => {
    const root = parseXml(`<a z="1" b="2" xmlns:q="v" xmlns:p="u"><p:c q:x="3"/></a>`);
    expect(canonicalize(root)).toBe(
      `<a b="2" z="1"><p:c xmlns:p="u" xmlns:q="v" q:x="3"></p:c></a>`,
    );
  });

  it("pulls the namespaces in scope down to an element taken out of its document", () => {
    const root = parseXml(`<a xmlns="d" xmlns:p="u"><b p:k="1">x &amp; &lt; &gt; "</b></a>`);
    const b = root.children[0] as ReturnType<typeof parseXml>;
    expect(canonicalize(b)).toBe(`<b xmlns="d" xmlns:p="u" p:k="1">x &amp; &lt; &gt; "</b>`);
  });

  it("keeps an undeclared default namespace and drops an unused declaration", () => {
    const root = parseXml(`<a xmlns="d" xmlns:unused="n"><b xmlns=""/></a>`);
    expect(canonicalize(root)).toBe(`<a xmlns="d"><b xmlns=""></b></a>`);
  });

  it("merges CDATA, character references and comments into text, and normalizes attributes", () => {
    const root = parseXml(`<a x="1&#10;2\n3">&#x41;<![CDATA[<b>]]><!-- gone -->!</a>`);
    expect(canonicalize(root)).toBe(`<a x="1&#xA;2 3">A&lt;b&gt;!</a>`);
  });

  it("renders the prefixes of an InclusiveNamespaces list", () => {
    const root = parseXml(`<a xmlns:p="u"><b/></a>`);
    expect(canonicalize(root.children[0] as typeof root, { inclusive: ["p"] })).toBe(
      `<b xmlns:p="u"></b>`,
    );
  });

  it("leaves out the omitted element only", () => {
    const root = parseXml(`<a><s/><b/></a>`);
    expect(canonicalize(root, { omit: root.children[0] as typeof root })).toBe(`<a><b></b></a>`);
  });
});

describe("the reader refuses what a signature must not hide behind", () => {
  const reading = (xml: string) => () => parseXml(xml);

  it("refuses a DOCTYPE, whatever it declares", () => {
    expect(reading(`<!DOCTYPE a [<!ENTITY x SYSTEM "file:///etc/passwd">]><a>&x;</a>`)).toThrow(
      XmlError,
    );
    expect(
      reading(
        `<!DOCTYPE lolz [<!ENTITY lol "lol"><!ENTITY lol2 "&lol;&lol;">]><lolz>&lol2;</lolz>`,
      ),
    ).toThrow(XmlError);
    expect(reading(`<?xml version="1.0"?><!DOCTYPE a><a/>`)).toThrow(XmlError);
  });
  it("refuses an entity that is not predefined", () => {
    expect(reading(`<a>&xxe;</a>`)).toThrow(XmlError);
  });
  it("refuses a processing instruction inside an element", () => {
    expect(reading(`<a><?x y?></a>`)).toThrow(XmlError);
  });
  it("refuses malformed documents", () => {
    expect(reading(`<a><b></a>`)).toThrow(XmlError);
    expect(reading(`<a x="1" x="2"/>`)).toThrow(XmlError);
    expect(reading(`<p:a/>`)).toThrow(XmlError);
    expect(reading(`<a/><b/>`)).toThrow(XmlError);
    expect(reading(`<a>&#0;</a>`)).toThrow(XmlError);
    expect(reading(`<a x="<"/>`)).toThrow(XmlError);
    expect(reading("")).toThrow(XmlError);
  });
  it("refuses a document nested or sized beyond the limits", () => {
    expect(reading("<a>".repeat(100) + "</a>".repeat(100))).toThrow(XmlError);
    expect(reading(`<a>${"x".repeat(1_000_001)}</a>`)).toThrow(XmlError);
  });
});
