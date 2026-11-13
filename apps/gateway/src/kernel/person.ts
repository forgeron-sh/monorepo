import type { PlatformPermission, Subject } from "@forgeron/permissions";

/**
 * Who is calling (D-137): the teams they are in, the subjects those make (`everyone` and a
 * `team:<id>` each) and what they may do on the platform, all read once per request.
 */
export interface Person {
  id: string;
  email: string;
  name: string;
  teams: string[];
  subjects: Subject[];
  permissions: PlatformPermission[];
}
