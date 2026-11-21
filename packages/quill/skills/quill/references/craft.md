# Craft

The rules every format shares. A format's guide adds to them; the project's `voice.md` overrides them where the two disagree. Each rule comes with a Bad → Good pair: match the pair's smell, not its words.

## Titles

- State the claim or the payoff, specific to this piece. 65 characters or fewer, sentence case, no final period. Put the words a reader would search for first.
- The form "Name: what it does" works for a launch.

| Bad                             | Good                                              |
| ------------------------------- | ------------------------------------------------- |
| Introducing our new gateway     | Gateway: each call timed step by step, and faster |
| Some thoughts on internal tools | The suite you rent, the tools you need            |

## Summary

The one or two sentences under the title, on the card and in the meta description. 160 characters or fewer for search, a verb in it, few words repeated from the title, never the content type ("In this post…").

## Opening

The point, or the problem it answers, within the first three sentences. Background, history and enthusiasm come later or not at all.

| Bad                                                                   | Good                                                                     |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| At Forgeron, we have always believed in the power of developer tools. | A cold call to a tool made four trips to the database. It now makes one. |

## Headings

Each heading carries information: read in order, the headings alone tell the story. "Background", "Results" and "Conclusion" say nothing; a claim or an action says something.

| Bad        | Good                  |
| ---------- | --------------------- |
| Background | The suite you rent    |
| Results    | Four trips became one |

## Paragraphs and sentences

- One idea per paragraph, at most five sentences. Split a sentence past 25 words.
- Lead with what matters; front-load the keyword.
- Active voice, plain words: "use", not "leverage"; "buy", not "purchase". A noun ending in -tion or -ment is often a verb in hiding.
- Address the reader as "you" when you tell them something to do.
- Define a term once, before its first use, and keep the same word for it afterwards.

## Evidence

- A number beats an adjective. Give each number its unit, its baseline, its method and its date: "618 ms → 109 ms, median of 10 runs, November 2026".
- A claim the material does not support becomes `[NEED: what would prove it]`, never a plausible sentence.
- Quote people in their own words, short, named, with their role, and only with their approval.
- State the limits and what did not work. Credit others' work generously.

| Bad                             | Good                                                               |
| ------------------------------- | ------------------------------------------------------------------ |
| The gateway is now much faster. | A cold call reads the tool, its access and its teams in one batch. |
| Customers love it.              | `[NEED: a customer quote, approved]`                               |

## Figures and code

- Draw a diagram for any system with three parts or more, labelled with the real names.
- Every figure has a one-line caption that says what to see in it.
- Code runs as shown: imports, config and versions included. Keep it short; link to the rest.

## Endings

End with something the reader can use: where to try it, the docs, the source, the next step, an open question. A recap of what they just read is a no-op; an ending reached is an ending taken.

## Tells of generated prose

The patterns that make a piece read as written on autopilot, which to ban and which to cap, and how to fix them without creating new ones: [`ai-tells.md`](ai-tells.md). Every draft is read against it before hand-over.

## Leave it alone

A sentence that is clear, true and in the voice stays, even when you would have written it differently. Over-editing a voiced draft is a failure equal to under-editing a rough one.
