import { Sparkline } from "@forgeron/ui";

export default function Default() {
  return (
    <Sparkline
      label="Signups, last 12 weeks"
      values={[12, 14, 13, 17, 16, 21, 19, 24, 26, 25, 29, 33]}
      width={160}
      height={40}
    />
  );
}
