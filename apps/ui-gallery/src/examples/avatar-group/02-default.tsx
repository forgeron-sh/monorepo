import { AvatarGroup } from "@forgeron/ui";

const team = [
  "Hugo Bernard",
  "Nadia Petit",
  "Léa Martin",
  "Tom Garnier",
  "Camille Roux",
  "Inès Faure",
];

export default function Default() {
  return (
    <>
      <AvatarGroup names={team.slice(0, 3)} />
      <AvatarGroup names={team} label="6 members" />
      <AvatarGroup names={team} max={3} size={32} label="6 members" />
    </>
  );
}
