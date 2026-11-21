import { Avatar, AvatarGroup, AvatarGroupCount } from "@forgeron/ui";

// The parts: AvatarGroup without names holds the avatars and the count.
export default function Composed() {
  return (
    <AvatarGroup aria-label="6 members">
      <Avatar name="Hugo Bernard" />
      <Avatar name="Nadia Petit" />
      <Avatar name="Léa Martin" />
      <AvatarGroupCount>+3</AvatarGroupCount>
    </AvatarGroup>
  );
}
