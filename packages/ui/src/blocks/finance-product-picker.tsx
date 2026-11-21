// The product of a line picked by typing: a button that opens a search over the catalogue. Built
// on the Combobox parts the way the relation picker of the data hub is.

import { PackageAdd01Icon } from "@forgeron/icons";
import { useMemo, useState } from "react";
import {
  Combobox,
  ComboboxChipsInput,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
} from "../combobox";
import { IconButton } from "../identity";
import { Popover } from "../popover";
import { formatMoney } from "../numbers";
import type { Minor } from "./finance-model";

export interface ProductOption {
  id: string;
  /** The name of the product: it becomes the description of the line. */
  label: string;
  /** Mono text at the end of the row: a reference (SKU). */
  hint?: string;
  /** Filled into the line: in minor units. */
  unitPrice?: Minor;
  taxRate?: number;
  unit?: string;
}

export interface ProductPickerProps {
  products: ReadonlyArray<ProductOption>;
  /** The chosen product id, marked in the list. */
  value?: string | null;
  onPick: (product: ProductOption) => void;
  currency: string;
  locale?: string;
  /** Names the button. Default "Pick a product". */
  label?: string;
  disabled?: boolean;
  /** Called when the popup closes, to hand the focus back to the sheet. */
  onClosed?: () => void;
}

/** A button opening a typeahead over the catalogue; Enter picks, Escape closes. */
export function ProductPicker({
  products,
  value,
  onPick,
  currency,
  locale,
  label = "Pick a product",
  disabled,
  onClosed,
}: ProductPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const byId = useMemo(() => new Map(products.map((p) => [p.id, p] as const)), [products]);
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products
      .filter((p) => !q || `${p.label} ${p.hint ?? ""}`.toLowerCase().includes(q))
      .map((p) => p.id);
  }, [products, query]);
  return (
    <Popover
      label={label}
      width={320}
      open={open}
      align="start"
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setQuery("");
          onClosed?.();
        }
      }}
      trigger={
        <IconButton
          icon={PackageAdd01Icon}
          label={label}
          size="sm"
          disabled={!!disabled}
          className="fg-fin-pick"
        />
      }
    >
      <Combobox
        inline
        open
        autoHighlight
        items={products.map((p) => p.id)}
        filteredItems={shown}
        itemToStringLabel={(id: string) => byId.get(id)?.label ?? id}
        inputValue={query}
        value={value ?? null}
        onValueChange={(id: string | null) => {
          const product = id ? byId.get(id) : undefined;
          if (product) {
            onPick(product);
            setOpen(false);
            setQuery("");
            onClosed?.();
          }
        }}
        onInputValueChange={(next: string, details: { isItemPress?: boolean }) => {
          if (!details.isItemPress) setQuery(next);
        }}
      >
        <div className="fg-fpop-head">
          <ComboboxChipsInput
            ref={(el: HTMLInputElement | null) => el?.focus({ preventScroll: true })}
            className="fg-fpop-input"
            placeholder="Search products…"
            aria-label="Search products"
          />
        </div>
        <ComboboxEmpty className="fg-fpop-empty">No product</ComboboxEmpty>
        <ComboboxList>
          {(id: string) => {
            const product = byId.get(id);
            if (!product) return null;
            return (
              <ComboboxItem
                key={id}
                value={id}
                hint={
                  product.unitPrice !== undefined
                    ? formatMoney(product.unitPrice, currency, locale)
                    : (product.hint ?? "")
                }
              >
                {product.label}
              </ComboboxItem>
            );
          }}
        </ComboboxList>
      </Combobox>
    </Popover>
  );
}
