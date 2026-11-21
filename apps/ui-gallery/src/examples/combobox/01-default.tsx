import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxInputGroup,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
} from "@forgeron/ui";

// shadcn's composition: Combobox without options is the root of the parts.
const frameworks = ["Next.js", "SvelteKit", "Nuxt", "Remix", "Astro"];

export default function Composed() {
  return (
    <div className="flex flex-col gap-4">
      <Combobox items={frameworks}>
        <ComboboxInput placeholder="Select a framework" aria-label="Framework" showClear />
        <ComboboxContent>
          <ComboboxEmpty>No framework found.</ComboboxEmpty>
          <ComboboxList>
            {(item: string) => (
              <ComboboxItem key={item} value={item}>
                {item}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
      <Combobox items={frameworks} multiple defaultValue={["Astro"]}>
        <ComboboxInputGroup>
          <ComboboxChips>
            <ComboboxValue>
              {(values: string[]) => (
                <>
                  {values.map((v) => (
                    <ComboboxChip key={v} removeLabel={`Remove ${v}`}>
                      {v}
                    </ComboboxChip>
                  ))}
                  <ComboboxChipsInput aria-label="Frameworks" />
                </>
              )}
            </ComboboxValue>
          </ComboboxChips>
        </ComboboxInputGroup>
        <ComboboxContent>
          <ComboboxEmpty>No framework found.</ComboboxEmpty>
          <ComboboxList>
            {(item: string) => (
              <ComboboxItem key={item} value={item}>
                {item}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  );
}
