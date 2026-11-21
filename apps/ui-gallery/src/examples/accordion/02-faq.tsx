import { Accordion } from "@forgeron/ui";

export default function Faq() {
  return (
    <div style={{ width: "min(100%, 480px)" }}>
      <Accordion
        defaultValue={["data"]}
        items={[
          {
            value: "data",
            title: "Where is my data stored?",
            content: "In the EU, on Cloudflare.",
          },
          {
            value: "export",
            title: "Can I export it?",
            content: "Yes: CSV and JSON, at any time.",
          },
          {
            value: "soon",
            title: "Single sign-on",
            hint: "Soon",
            content: "Planned.",
            disabled: true,
          },
        ]}
      />
    </div>
  );
}
