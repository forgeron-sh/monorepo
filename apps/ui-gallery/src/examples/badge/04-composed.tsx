import { Badge } from "@forgeron/ui";

export default function Composed() {
  return (
    <>
      <Badge>Default</Badge>
      <Badge variant="default">Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="destructive">Destructive</Badge>
      <Badge variant="outline">Outline</Badge>
      <Badge asChild variant="outline">
        <a href="#badge">Link</a>
      </Badge>
    </>
  );
}
