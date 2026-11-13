# @forgeron/permissions

The one permission engine of Forgeron (D-137): subjects (`everyone`, `team:<id>`), atomic permissions that imply others (a write gives its read), the union of what a person's teams hold, and the rule against escalation (nobody gives what they do not hold). It also declares the platform's own catalog (`PLATFORM`: tools, access, members, teams, marketplaces, settings, operations) and the two teams every workspace has, `admin` and `developer`.

A tool's own access (its permissions, profiles and the Access tab's matrix) uses the same subjects, in `@forgeron/manifest`.

## In the monorepo

Depends on no other package (`permissions-is-a-leaf` rule). Published with the other packages, since `@forgeron/manifest` and the runtime read it.
