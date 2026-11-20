// A postal address as five fields: street, second line, postcode, city, country. Typed, no lookup,
// nothing leaves the page. The composed form is `AddressField` with `AddressFieldPart` (one per
// part, any order); with `label`, the props-driven one built from them (D-157).

import { createContext, useContext, type ComponentProps } from "react";
import { Combobox } from "./combobox";
import { cx } from "./cx";
import { Field, Input } from "./form";
import { useControllableState } from "./hooks/use-controllable";

/** A postal address; every line is optional. */
export interface FormAddress {
  line1?: string;
  line2?: string;
  postcode?: string;
  city?: string;
  country?: string;
}

export type AddressPart = keyof FormAddress;

export interface AddressFieldProps {
  /** Names the group for assistive technology: the question. */
  label: string;
  value?: FormAddress;
  defaultValue?: FormAddress;
  onChange?: (value: FormAddress) => void;
  /** The countries to choose from, as `{ value, label }`; absent, the country is typed. */
  countries?: ReadonlyArray<{ value: string; label: string }>;
  /** What is wrong, by part. */
  errors?: Partial<Record<AddressPart, string>>;
  /** Marks the parts that must be filled: all but the second line. */
  required?: boolean;
  disabled?: boolean;
  id?: string;
  describedBy?: string;
  className?: string;
}

const PARTS: ReadonlyArray<{
  key: AddressPart;
  label: string;
  auto: string;
  span: "full" | "post" | "city";
}> = [
  { key: "line1", label: "Address line 1", auto: "address-line1", span: "full" },
  { key: "line2", label: "Address line 2", auto: "address-line2", span: "full" },
  { key: "postcode", label: "Postcode", auto: "postal-code", span: "post" },
  { key: "city", label: "City", auto: "address-level2", span: "city" },
  { key: "country", label: "Country", auto: "country-name", span: "full" },
];

interface AddressState {
  address: FormAddress;
  set: (key: AddressPart, text: string) => void;
  countries: AddressFieldProps["countries"];
  errors: AddressFieldProps["errors"];
  required: boolean | undefined;
  disabled: boolean | undefined;
}

const AddressContext = createContext<AddressState | null>(null);

/**
 * A postal address as five fields. With `label`: the props-driven one. Without: the root of the
 * parts, `AddressFieldPart` for each field you want.
 */
export function AddressField(props: AddressFieldProps | AddressFieldRootProps) {
  return props.label !== undefined ? (
    <AddressFieldBox {...(props as AddressFieldProps)} />
  ) : (
    <AddressFieldRoot {...(props as AddressFieldRootProps)} />
  );
}

function AddressFieldBox({
  label,
  onChange,
  describedBy,
  value,
  defaultValue,
  ...rest
}: AddressFieldProps) {
  return (
    <AddressFieldRoot
      aria-label={label}
      {...(describedBy ? { "aria-describedby": describedBy } : {})}
      {...(value !== undefined ? { value } : {})}
      {...(defaultValue !== undefined ? { defaultValue } : {})}
      {...(onChange ? { onValueChange: onChange } : {})}
      {...rest}
    >
      {PARTS.map((p) => (
        <AddressFieldPart key={p.key} name={p.key} />
      ))}
    </AddressFieldRoot>
  );
}

/** `label` stays undefined: with a label, `AddressField` is the props-driven one. */
export type AddressFieldRootProps = Omit<
  ComponentProps<"div">,
  "className" | "defaultValue" | "onChange"
> & {
  label?: undefined;
  value?: FormAddress;
  defaultValue?: FormAddress;
  onValueChange?: (value: FormAddress) => void;
  countries?: ReadonlyArray<{ value: string; label: string }>;
  errors?: Partial<Record<AddressPart, string>>;
  required?: boolean;
  disabled?: boolean;
  className?: string;
};

function AddressFieldRoot({
  label: _label,
  value,
  defaultValue,
  onValueChange,
  countries,
  errors,
  required,
  disabled,
  className,
  children,
  ...rest
}: AddressFieldRootProps) {
  const [address, setAddress] = useControllableState<FormAddress>({
    value,
    defaultValue: defaultValue ?? {},
    onChange: onValueChange,
  });
  const state: AddressState = {
    address,
    set: (key, text) => setAddress({ ...address, [key]: text }),
    countries,
    errors,
    required,
    disabled,
  };
  return (
    <AddressContext.Provider value={state}>
      <div role="group" {...rest} className={cx("fg-fm-address", className)}>
        {children}
      </div>
    </AddressContext.Provider>
  );
}

export interface AddressFieldPartProps {
  /** Which part of the address. */
  name: AddressPart;
  /** The words above the field. Default: the usual name of the part. */
  label?: string;
  className?: string;
}

/** One field of the address (line 1, line 2, postcode, city, country), with its label and error. */
export function AddressFieldPart({ name, label, className }: AddressFieldPartProps) {
  const ctx = useContext(AddressContext);
  if (!ctx) throw new Error("AddressFieldPart goes inside <AddressField>.");
  const p = PARTS.find((x) => x.key === name)!;
  const words = label ?? p.label;
  const optional = p.key === "line2" || !ctx.required;
  return (
    <Field
      label={optional && ctx.required ? `${words} (optional)` : words}
      error={ctx.errors?.[p.key]}
      className={cx("fg-fm-address-part", `fg-fm-address-${p.span}`, className)}
    >
      {(control) =>
        p.key === "country" && ctx.countries ? (
          <Combobox
            label={words}
            options={ctx.countries}
            value={ctx.address.country ?? null}
            onChange={(next) => ctx.set("country", next ?? "")}
            clearable
            disabled={ctx.disabled}
            id={control.id}
            aria-describedby={control["aria-describedby"]}
            aria-invalid={control["aria-invalid"]}
          />
        ) : (
          <Input
            {...control}
            value={ctx.address[p.key] ?? ""}
            autoComplete={p.auto}
            disabled={ctx.disabled}
            onChange={(event) => ctx.set(p.key, event.target.value)}
          />
        )
      }
    </Field>
  );
}
