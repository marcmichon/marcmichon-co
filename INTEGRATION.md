# Intégration JSON-LD — marcmichon.co

Le projet ne possède pas de `Layout.astro` global : toutes les pages injectent déjà leur `<head>` via `BaseHead.astro`.
La logique unique d’injection JSON-LD a donc été placée dans ce composant partagé.

## Fichiers à ajouter/remplacer

- Ajouter `src/lib/seo/schema.ts`
- Ajouter `src/components/seo/StructuredData.astro`
- Remplacer `src/components/BaseHead.astro`

## Home

```astro
---
import { graphSchema, personSchema, websiteSchema } from '../lib/seo/schema';

const schema = graphSchema([
  personSchema(),
  websiteSchema(),
]);
---

<BaseHead
  title={SITE_TITLE}
  description={SITE_DESCRIPTION}
  schema={schema}
/>
```

## Page Labs

```astro
---
import {
  breadcrumbSchema,
  suiteSchema,
} from '../lib/seo/schema';

const schema = [
  suiteSchema(),
  breadcrumbSchema([
    { name: 'Accueil', url: '/' },
    { name: 'Labs', url: '/labs/' },
  ]),
];
---

<BaseHead title={title} description={description} schema={schema} />
```

## Application

```astro
---
import {
  breadcrumbSchema,
  softwareApplicationSchema,
} from '../../lib/seo/schema';

const schema = [
  softwareApplicationSchema({
    name: 'MM IOC Analyzer',
    description: 'Extraction, normalisation et préparation des IOC pour l’investigation.',
    url: '/labs/ioc-analyzer/',
    version: '1.0',
    image: '/Images/tools/ioc-analyzer.png',
    features: [
      'Extraction multi-format',
      'Normalisation des IOC',
      'Déduplication',
      'Rapport PDF local',
    ],
  }),
  breadcrumbSchema([
    { name: 'Accueil', url: '/' },
    { name: 'Labs', url: '/labs/' },
    { name: 'IOC Analyzer', url: '/labs/ioc-analyzer/' },
  ]),
];
---

<BaseHead title={title} description={description} schema={schema} />
```

## Note de Terrain

Les dates doivent être au format ISO 8601, par exemple `2026-07-12`.

```astro
---
import {
  articleSchema,
  breadcrumbSchema,
} from '../../lib/seo/schema';

const schema = [
  articleSchema({
    title: 'Les exclusions : le risque silencieux des plateformes EDR',
    description: '...',
    url: '/articles/exclusions-edr-risque-silencieux/',
    datePublished: '2026-06-14',
    dateModified: '2026-07-01',
    image: '/Images/exclusions.png',
    section: 'Endpoint Security',
    keywords: ['EDR', 'Exclusions', 'Security Operations'],
  }),
  breadcrumbSchema([
    { name: 'Accueil', url: '/' },
    { name: 'Notes de Terrain', url: '/notes-de-terrain/' },
    {
      name: 'Les exclusions : le risque silencieux des plateformes EDR',
      url: '/articles/exclusions-edr-risque-silencieux/',
    },
  ]),
];
---

<BaseHead
  title={title}
  description={description}
  schema={schema}
  ogType="article"
/>
```

## Vérification

Après intégration :

```bash
npm run build
```

Puis inspecter le HTML généré et vérifier les pages dans :

- Google Rich Results Test
- Schema.org Validator

Le JSON-LD doit apparaître une seule fois dans le `<head>` de chaque page.
