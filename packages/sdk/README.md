# @forgeron/sdk

Ce qu'importe un tool. L'API publique est spécifiée dans `docs/sdk.md` ; ce paquet la met en œuvre.

## Contenu prévu

- `.` : `defineConfig`, `action`, `on`, `schedule`, `z`, `ToolError` (`sdk.md` §3, §6, §9)
- `./db` : schéma, migrations, `sql` (`sdk.md` §8)
- `./react` : `defineView`, `useAction`, `useMutation`, `useParams`, `useUser`, `useCan` (`sdk.md` §11)
- `./testing` : `createTestTool`, `mockFetch` (`sdk.md` §13)

## Notes

N'importe ni `@forgeron/compiler` ni `@forgeron/hosting` (règle `sdk-stays-light`) : un tool n'embarque jamais d'outil de build ou de déploiement.
