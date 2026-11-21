// The whole icon catalog, behind a door of its own: the icon picker reaches it only through a
// dynamic `import()` of this module, so a bundler puts it in a chunk that loads when a picker opens
// (or an `IconByName` meets a name it does not know), never in the page's own bundle.
// A dynamic import of `@forgeron/icons` itself would not split: the package is also imported
// statically, so the bundler would keep every icon in the main chunk.

export * from "@forgeron/icons";
