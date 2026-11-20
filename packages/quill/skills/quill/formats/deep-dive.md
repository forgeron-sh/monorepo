# Engineering deep dive

How something was built or measured, for engineers: the design, the numbers, what failed. Signed by the people who built it.

## Structure

1. **The problem, at its scale.** What broke or what was slow, with the number that made it matter. An anecdote works if it is real ("A cold call made four trips to the database").
2. **The constraints.** What the solution had to respect.
3. **The design.** A diagram labelled with real names; the alternatives rejected and why.
4. **The build, in phases.** Each phase a heading that says what it did; code where it clarifies.
5. **What did not work.** The dead ends, honestly.
6. **Results.** Before → after, with the method: how many runs, which machine, which date.
7. **Limits and next steps.** Where it does not apply; what comes next. Detail goes to an appendix.

## Title

"How we X" or a sentence giving the cause and the result: "AI coding made CI a bottleneck, so we reworked ours".

## Opening

The concrete problem and its scale, in the first paragraph.

## Evidence

Every metric has a baseline, a method and a date. Every diagram uses the system's real names. Every code sample runs. A technical reviewer who did not write the piece signs off on its accuracy.

## Length

1,500 to 4,000 words, figures included. Split into a series past that.

## Checklist

- [ ] The byline names the engineers who built it.
- [ ] The problem's scale is a number in the first paragraph.
- [ ] Rejected alternatives are explained.
- [ ] A section says what did not work, and one states the limits.
- [ ] Every metric: baseline, method, date.
- [ ] Diagrams for every system of three parts or more, with real names.
- [ ] The headings read as an outline of the work.
- [ ] A technical reviewer has signed off.

Drawn from: Sentry's guide, Stripe "Online migrations at scale", Anthropic Engineering, Linear, Vercel, Cloudflare's incident posts, Dan Luu on engineering blogs (see `registry.json`).
