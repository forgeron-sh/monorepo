# Changelog entry

One change or one release, for the people it touches. The title is the news; the body says what changed for them.

## Structure

1. **Title**: the outcome, verb-led or as "X now does Y".
2. **Summary**: one sentence.
3. **Notes**: one change per line, grouped by kind when there are several: New, Improved, Fixed, Breaking, Deprecated, Removed, Security.
4. **For a breaking change**: what is affected, and the steps to upgrade.
5. **A link** to the docs or the detail, when there is one.

A large release may get a short section per feature; anything longer is a blog post that the entry links to.

## Title

"Gateway: each call timed step by step, and faster". Sentence case, the outcome for the reader.

## Evidence

The version and the date come from the release itself (the project's own changelog file, a tag), never from memory. A speed change carries its number.

## Language

Written for users, from what changed for them, not copied from commit messages. Each line starts the same way within a group ("Adds…", "Fixes…", or the new behaviour stated).

## Length

One or two sentences per change.

## Checklist

- [ ] Version and date match the release.
- [ ] The title states the outcome.
- [ ] One change per line, grouped by kind.
- [ ] Breaking changes and deprecations are flagged, with upgrade steps.
- [ ] Written for users, not from the commit log.
- [ ] Verbs are consistent within each group.
- [ ] A link when there is more to read.

Drawn from: Keep a Changelog, Linear, Vercel and Stripe changelogs (see `registry.json`).
