import { Breadcrumb } from "@forgeron/ui";

export default function Default() {
  return (
    <Breadcrumb
      items={[
        { label: "Operations", href: "#operations" },
        { label: "Issues", href: "#issues" },
        { label: "OPS-40" },
      ]}
    />
  );
}
