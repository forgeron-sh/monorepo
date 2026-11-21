import { Combobox, type ComboboxOption } from "@forgeron/ui";
import { useEffect, useState } from "react";

const people = [
  "Ada Lovelace",
  "Alan Turing",
  "Grace Hopper",
  "Linus Torvalds",
  "Margaret Hamilton",
];

// A stand-in for a server: answers after a short wait, with what matches.
const search = (query: string): Promise<ComboboxOption[]> =>
  new Promise((resolve) =>
    setTimeout(
      () =>
        resolve(
          people
            .filter((p) => p.toLowerCase().includes(query.toLowerCase()))
            .map((p) => ({ value: p.toLowerCase().replace(/\s/g, "."), label: p })),
        ),
      400,
    ),
  );

export default function Async() {
  const [query, setQuery] = useState("");
  // The answer remembers the question it belongs to: while they differ, the list is loading.
  const [answer, setAnswer] = useState<{ query: string; options: ComboboxOption[] } | null>(null);
  useEffect(() => {
    let live = true;
    search(query).then((options) => live && setAnswer({ query, options }));
    return () => {
      live = false;
    };
  }, [query]);
  return (
    <Combobox
      label="Assignee"
      placeholder="Search people"
      options={answer?.options ?? []}
      filter={false}
      loading={answer?.query !== query}
      onInputChange={setQuery}
    />
  );
}
