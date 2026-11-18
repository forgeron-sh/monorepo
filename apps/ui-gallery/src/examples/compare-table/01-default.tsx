import { CloudflareIcon, CloudIcon, Settings01Icon } from "@forgeron/icons";
import { CompareTable } from "@forgeron/ui";

export default function Default() {
  return (
    <CompareTable
      label="Plans compared"
      columns={[
        { name: "Cloud", icon: CloudIcon },
        { name: "Self-managed", icon: CloudflareIcon },
        { name: "Own servers", icon: Settings01Icon },
      ]}
      groups={[
        {
          group: "Running it",
          rows: [
            { name: "Cloudflare's network", v: [true, true, false] },
            { name: "Recipes and plugins", v: ["Soon", "Soon", "Soon"] },
            { name: "Per seat, per month", v: ["$14.99", "$0", "$0"] },
          ],
        },
      ]}
    />
  );
}
