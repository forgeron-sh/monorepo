import { Avatar, AvatarFallback, AvatarImage } from "@forgeron/ui";

export default function Composed() {
  return (
    <>
      <Avatar size="sm">
        <AvatarFallback>HL</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarImage src="/none.png" alt="Claire Moreau" />
        <AvatarFallback>CM</AvatarFallback>
      </Avatar>
      <Avatar size="lg">
        <AvatarFallback>NB</AvatarFallback>
      </Avatar>
    </>
  );
}
