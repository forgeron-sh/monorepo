import { AddressField } from "@forgeron/ui";

// A list of countries and the problems of a required address, said part by part.
export default function Countries() {
  return (
    <AddressField
      label="Billing address"
      required
      defaultValue={{ line1: "12 Example Street", city: "Lyon" }}
      countries={[
        { value: "France", label: "France" },
        { value: "Belgium", label: "Belgium" },
        { value: "Switzerland", label: "Switzerland" },
      ]}
      errors={{ postcode: "Required", country: "Required" }}
    />
  );
}
