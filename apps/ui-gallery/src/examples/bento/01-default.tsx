import { Bento, BentoCell, SoonTag } from "@forgeron/ui";

export default function Default() {
  return (
    <Bento>
      <BentoCell
        span={3}
        rows={2}
        title="Usage per team"
        text="One unit for everything a tool runs."
        art={<div className="fg-dots" style={{ height: "100%" }} />}
      />
      <BentoCell
        span={3}
        rows={2}
        corner={<SoonTag />}
        title="One AI gateway"
        text="Every model behind one entry, and who calls what."
        art={<div className="fg-dots" style={{ height: "100%" }} />}
      />
    </Bento>
  );
}
