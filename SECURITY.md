# Politique de sécurité

## Signaler une faille

**N'ouvrez pas d'issue publique pour une faille de sécurité.**

Utilisez le signalement privé de GitHub : onglet **Security** du dépôt, puis **Report a vulnerability**. Indiquez :

- la partie concernée (SDK, CLI, runtime, gateway, console, modèle) ;
- les étapes pour reproduire ;
- l'impact estimé ;
- si possible, une piste de correction.

Sont particulièrement attendus : contournement d'un niveau d'accès, fuite d'un secret ou d'un secret par personne, jeton accepté hors de son audience, sortie réseau non déclarée, accès d'une preview aux données de production.

## La suite

1. Nous accusons réception.
2. Nous confirmons la faille et évaluons sa gravité.
3. Nous la corrigeons et publions une nouvelle version.
4. Nous vous tenons informé et vous créditons si vous le souhaitez.

Merci de ne pas divulguer la faille avant la publication d'un correctif.

## Versions maintenues

Seule la dernière version reçoit les correctifs de sécurité.
