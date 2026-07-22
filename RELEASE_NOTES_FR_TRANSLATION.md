# Explorateur de vulnérabilités — couche de traduction FR/EN

## Contenu

- Ajout de `src/locales/fr.ts`, `src/locales/en.ts` et `src/locales/index.ts`.
- Interface de l’Explorateur de vulnérabilités traduite en français.
- Décisions, justifications, impacts, actions et niveaux de confiance produits en français.
- Export PDF traduit en français.
- Dates et pourcentages localisés en `fr-FR`.
- Dictionnaire anglais conservé pour préparer une future route `/en`.

## Principe

Les standards et sources restent inchangés : CVE, CVSS, EPSS, NVD et CISA KEV.
La couche d’interprétation produite par MM Security Intelligence est localisée.

## Vérifications recommandées

1. Tester une CVE critique, une CVE élevée et une CVE faible.
2. Vérifier les badges de sévérité et de confiance.
3. Vérifier le plan de réponse et les justifications.
4. Exporter deux CVE successives en PDF.
5. Vérifier les dates et pourcentages en français.

## Build

Exécuter :

```bash
npm run build
```
