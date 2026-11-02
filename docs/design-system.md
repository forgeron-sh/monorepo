# Forgeron — design system

Forgeron est la plateforme où les entreprises forgent, versionnent et hébergent leurs internal tools. Un tool s'écrit une fois avec le SDK (actions, permissions, données) et s'expose en quatre interfaces : MCP pour Claude, API, Web et CLI (chaque action devient une commande, ex. `forgeron odoo tickets list`). L'identité tient dans une enclume noir et blanc : le système est **monochrome**, la couleur est réservée aux états.

## Principes

1. **Noir et blanc d'abord.** L'accent de la marque, c'est `ink` lui-même : blanc sur `bg` noir en thème sombre, noir sur blanc en thème clair. Aucune teinte de marque : ni bleu, ni orange braise, ni dégradé.
2. **La couleur est une information.** `success`, `warning` et `danger` n'apparaissent que pour un état (build, déploiement, erreur) et toujours avec un mot ou une icône.
3. **Le trait, pas l'ombre.** On sépare par `line`. `shadow-pop` est réservé à ce qui flotte (menus, palette de commandes).
4. **Zéro arrondi.** Comme l'enclume : tout est à angles vifs (`radius-none`), cartes, boutons et champs compris. Le rond n'existe qu'en découpe (le motif de l'enclume) ou en pastille d'état (`radius-full`).
5. **Fait pour les développeurs.** Le code, les identifiants et les versions sont des citoyens de premier rang, en `code` / `code-inline`.

## Ton et contenu

- Interface en français, vouvoiement. Phrases courtes, à l'indicatif ou à l'impératif.
- Les termes que les développeurs utilisent restent en anglais : commit, branche, preview, build, MCP, API, SSO, SDK. On écrit « tool » ou « internal tool » pour l'objet, « outil » dans les phrases générales.
- Vocabulaire fixe : **espace** (l'entreprise), **tool**, **action** (ce que le SDK définit, ex. `crm.contacts.update`), **interface** (MCP, API, Web, CLI), **version**, **environnement** (Production, Pilote, Preview), **accès**, **rôle**.
- Le registre de la forge s'emploie avec parcimonie : le verbe « forger » dans les titres marketing (« Forgez vos outils. »), jamais dans les libellés d'action. Un bouton dit « Déployer », pas « Forger ».
- Boutons : un verbe à l'infinitif sans point. Messages d'erreur : ce qui s'est passé, puis quoi faire (« Le build a échoué à l'étape test. Ouvrez les logs. »).
- Pas d'emoji dans l'interface ni dans la documentation.
- Exemples réels plutôt que lorem ipsum : un CRM, une fiche contact, une passerelle Odoo.

## Couleur

- Fond de page `bg` ; zones secondaires `surface` ; cartes et menus `surface-raised` avec bordure `line` ; code et terminal `surface-sunken`.
- Texte `ink` ; texte secondaire et placeholders `ink-muted` ; `ink-faint` uniquement pour le désactivé et les numéros de ligne.
- Éléments forts (bouton principal, case cochée, environnement Production, sélection) : fond `inverse`, texte `on-inverse`.
- Contours de champs et de boutons secondaires : `line-strong` (≥ 3:1 dans les deux thèmes).
- États : `success` / `success-subtle`, `warning` / `warning-subtle`, `danger` / `danger-subtle`, toujours avec un libellé. Ces couleurs ne servent jamais à décorer.
- Le thème **Forge (sombre)** est le thème par défaut, celui du logo. Le thème **Atelier (clair)** en est l'exact négatif.

## Typographie

- `display` (Inter Display SemiBold, interlettrage resserré) pour les titres d'écran et le marketing : `display-xl`, `display-l`, `title-1`. C'est la police du logotype.
- `sans` (Inter) pour l'interface : `title-2`, `title-3`, `body` (14/22, la taille par défaut), `body-strong`, `small`, `caption`.
- `mono` (JetBrains Mono, chargée depuis Google Fonts) pour `code`, `code-inline` et `eyebrow`. Tout ce qui se copie-colle (commande CLI, nom d'action, version, hash, URL MCP) est en mono.
- Titres en casse de phrase (« Versions déployées »), jamais tout en capitales sauf `eyebrow`.

## Espacement, rayons, mise en page

- Grille de 4px : `space-1` (4) à `space-16` (64). Padding de carte `space-6`, écart entre champs `space-4`, entre sections `space-8`.
- `radius-none` (0) partout : cartes, menus, blocs de code, dialogues, boutons, champs, badges, cases. Jamais de petit arrondi de 4 ou 6px. `radius-full` seulement pour les pastilles d'état.
- Densité d'outil de développeur : contrôles de 32px, lignes de tableau de 44px, texte à 14px.
- Application : barre latérale `surface` à gauche (espace, tools, réglages), contenu sur `bg`, largeur de lecture max. 1200px.

## États et interaction

- Survol : `surface-hover`. Sélection active : `inverse`.
- Focus clavier : anneau `focus` plein de 2px, décalé de 2px, sur tous les éléments interactifs (≥ 14:1 sur toutes les surfaces).
- Désactivé : texte `ink-faint`, contour `line`, pas d'opacité globale.
- Mouvement : transitions de 120 ms sur la couleur de fond et de bordure uniquement. Rien ne rebondit.

## Environnements et versions

Chaque push sur GitHub produit une version. Les environnements se distinguent par la **forme** (`EnvTag`), jamais par la couleur :

- **Production** : plein `inverse`, pastille pleine.
- **Pilote** : contour `ink`, pastille creuse — version ouverte à un groupe test.
- **Preview** : contour pointillé, texte `ink-muted` — build de branche.

Les états du build (`En ligne`, `Build en cours`, `Échec`) passent par `Badge` avec `success`, `warning`, `danger`.

## Logo

- Fichiers dans le groupe **Logos** : symbole (l'enclume), logo horizontal (symbole + « forgeron »), wordmark seul, en blanc ou en noir sans fond, et versions sur fond pour les avatars et icônes d'application.
- Sur `bg` sombre : version **blanc** ; sur fond clair : version **noir**. Jamais d'autre couleur, jamais de contour, jamais de dégradé ni d'ombre.
- Le logotype s'écrit en minuscules : « forgeron ». Dans un texte, le nom s'écrit « Forgeron ».
- Avatar, favicon, icône d'application : `forgeron-symbole-plein-cadre-*` (symbole bord à bord) ou `forgeron-symbole-standard-*` (symbole avec marge).
- Zone de protection et taille minimale : à définir.

## Iconographie

- Pas encore de jeu d'icônes propre. En attendant : Lucide, trait 1.5px, 16px dans l'interface, en `ink` ou `ink-muted`, jamais coloré sauf pour un état.
- Une icône d'état accompagne toujours son libellé ; aucune icône seule ne porte une information.
- Le symbole de l'enclume n'est pas une icône d'interface : il ne sert qu'à la marque.
