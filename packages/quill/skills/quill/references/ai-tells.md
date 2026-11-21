# Tells of generated prose

The patterns that make a piece read as written on autopilot. Their cause is almost always the same: a generic claim where a specific fact should be. So the fix is the fact, never a synonym.

Two kinds:

- **Ban**: one occurrence is enough. Rewrite the sentence from its facts.
- **Cap**: fine once in a section. Two or more caps in one paragraph mean the paragraph is rewritten.

## Ban

| Pattern               | Watch for                                                                             | Bad → Good                                                                           |
| --------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Announce opener       | "We're excited to announce", "In today's fast-paced world", "At Forgeron, we believe" | "We're excited to announce faster calls." → "Calls to a tool now start sooner."      |
| Negative parallelism  | "not just X, but Y", "it's not X, it's Y", "X rather than Y" when nobody said X       | "It's not a cache, it's a contract." → "The cache answers within 5 ms."              |
| Negation list         | "No X. No Y. Just Z."                                                                 | "No setup. No YAML. Just run it." → "`forgeron init` writes the config."             |
| Question, then answer | "The result?", "The catch?", "Why does this matter?"                                  | "The result? Three times faster." → "Queries ran three times faster."                |
| Colon reveal          | "Here's the secret:", "One word: speed."                                              | "Here's the trick: batching." → "Batching the reads fixed it."                       |
| Staged run-up         | "Here's the thing", "Let's dive in", "Here's the kicker"                              | Delete the run-up; start with the point.                                             |
| Aphorism              | "Speed is a feature.", "You can't fix what you can't see."                            | "Observability is trust." → "Without traces we could not tell which service failed." |
| Closing kicker        | "And that changes everything.", "The future looks bright.", "We can't wait to see…"   | End on the link, the command or the open question.                                   |
| One-line restatement  | "That's the real win.", "That distinction matters."                                   | "Retries hide outages. That matters." → "Retries hide outages shorter than 30 s."    |
| Smug simplicity       | "That's it. That's all you need." after a code block                                  | Delete it; the code shows it.                                                        |
| Signposted summary    | "In this post we'll explore", "In conclusion", "To sum up"                            | Delete; the headings are the map.                                                    |
| Heading echo          | "## Performance" then "Performance matters."                                          | Open the section with its first fact.                                                |
| Inflated significance | "marks a pivotal moment", "reflects a broader shift", "sets the stage"                | Say what changed and for whom.                                                       |
| Vague authority       | "experts agree", "industry reports", "trusted by leading teams"                       | Name the source, or `[NEED: source]`.                                                |
| Grand stakes          | "will reshape everything", "Imagine a world where"                                    | The concrete outcome, at its real scale.                                             |
| Outlook block         | "Despite these challenges…", "continues to thrive"                                    | A dated next step, or nothing.                                                       |
| Reasoning leak        | "Here's why this matters", "This diagram shows…", "anything unconfirmed is flagged"   | Show it; the caption says what to see.                                               |
| Chatbot residue       | "I hope this helps", "Great question", "Let me know if"                               | Delete.                                                                              |
| Hype words            | seamless, robust (as praise), leverage, unlock, empower, game-changing, best-in-class | "A seamless sync." → "Sync retries three times, then queues the write."              |

## Cap

| Pattern             | Watch for                                                                             | Bad → Good                                                                      |
| ------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Stock words         | delve, pivotal, underscore, showcase, foster, intricate, tapestry, testament, vibrant | "This pivotal refactor" → "The refactor cut cold starts from 2.1 s to 0.8 s"    |
| Copula dodge        | "serves as", "stands as", "boasts", "features"                                        | "The CLI serves as the entry point." → "The CLI is the entry point."            |
| Magic adverbs       | quietly, fundamentally, genuinely, truly, simply                                      | "It quietly schedules jobs." → "It schedules jobs."                             |
| Forced triad        | "fast, secure and scalable", three parallel examples by reflex                        | "Faster builds, cleaner diffs, happier teams." → "Builds take 40 s, not 3 min." |
| Staccato fragments  | "Simple. Fast. Done."                                                                 | "No errors. No warnings." → "The build had no errors or warnings."              |
| Trailing -ing       | ", ensuring…", ", highlighting…", ", fostering…" at the end of a sentence             | "It syncs nightly, ensuring nothing slips." → "It syncs nightly."               |
| Parallel ad copy    | "Metrics tell you what. Traces tell you why."                                         | One sentence with the fact.                                                     |
| Invented label      | "the integration tax", "the acceleration trap"                                        | Describe the thing; name it only if the name is used again.                     |
| False range         | "from startups to enterprises"                                                        | Name who it is for.                                                             |
| Decorative analogy  | "Think of it as a Swiss Army knife"                                                   | Keep an analogy only when the explanation leans on it.                          |
| Arguing with no one | "To be clear", "I'm not saying", "A tempting approach would be"                       | Answer a doubt the reader actually has, or cut.                                 |
| Synonym cycling     | the runtime, then the engine, then the execution layer, for one thing                 | One term, every time (`voice.md`, Vocabulary).                                  |
| Stacked hedges      | "could potentially", "might arguably"                                                 | One hedge: "may".                                                               |
| Bold-label bullets  | "**Performance:** performance was improved"                                           | Bold only a label that adds information.                                        |
| Dashes as glue      | several " — " per paragraph                                                           | A period, a comma, or parentheses.                                              |
| Perfect balance     | every section the same length, two sentences and three bullets each                   | Let a section be as long as its material.                                       |
| Bookend personality | a lively intro and outro around a flat middle                                         | The voice in the middle too: decisions, numbers, what failed.                   |
| Round numbers       | suspiciously neat figures, too-tidy anecdotes                                         | The measured number, with its method.                                           |

## How to fix

1. **Go back to the facts.** The mechanism, the number, the person, the step. Rewrite the sentence from them; a synonym swap breeds a new tell.
2. **Never invent to sound human.** No made-up anecdote, number or first-person memory. Missing material becomes `[NEED: …]`, or a simpler sentence.
3. **Vary the fixes.** If every reveal becomes ", because…", that is the next tic.
4. **Check the second generation.** After a rewrite, read again for aphorisms, tidy closers, triads, dashes and equal section lengths: they survive first passes most.
5. **Keep every fact.** After the rewrite, check no name, number, date, quote or condition was lost.
6. **Run the swap test.** Could the sentence sit unchanged on a competitor's site? Then it says nothing yet.

## Leave alone

Over-correcting is a tell of its own. These stay:

- Technical senses: robust (error handling, statistics), key (in a map), highlight (syntax), ecosystem (packages), landscape (orientation), gate.
- "Additionally", "notably", "consequently" alone; "perhaps", "tends to", "in order to", "the first", "the only": common in human writing.
- Passive voice when the actor does not matter; a precise, formal register.
- A real contrast that corrects a belief the reader holds; a real list of three; one deliberate fragment that adds a fact.
- A one-line paragraph that carries a new fact.
- Quotes, titles and proper names, exactly as they are.

Sources: Wikipedia "Signs of AI writing", blader/humanizer, marketingskills `ai-tells.md`, Sentry's blog writing guide, tw93/Waza `write` (see `registry.json`).
