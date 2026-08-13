# Changelog




Toutes les évolutions importantes de **marcmichon.co** sont documentées dans ce fichier.

Au fil de son évolution, le projet est passé d'un simple carnet de notes techniques à une plateforme de cybersécurité réunissant des **Field Notes** et la **MM Security Intelligence Suite**.

Ce projet suit le principe du **Semantic Versioning** et ce changelog s'inspire du format **Keep a Changelog**.

---

# 🚀 v1.7.0 — MM Attack Path Explorer

## ✨ Nouveautés

- Official release of **MM Attack Path Explorer**.
- Interactive attack path exploration across assets, identities, privileges and critical targets.
- Three predefined attack path scenarios.
- **Guided Attack Path Builder** for rapid scenario construction.
- **Custom Attack Path Builder** with free node labels, structured node types and relationships.
- Dynamic attack path scoring.
- Automatic identification of recommended choke points.
- Remediation simulation and impact visualization.
- Professional multi-page **PDF Attack Path Assessment** export.

## 🎨 MM Labs

- **MM Attack Path Explorer** added to the released product catalog.
- MM Labs hero and product roadmap updated.
- New dedicated artwork for Attack Path Explorer.
- New generic **Research** and **Planned** roadmap visuals.
- **MM Exposure Analyzer** moved to Research status.
- **MM Patch Planner** retained as Planned.
- Product cards and roadmap visuals harmonized with the MM Security Intelligence Suite design language.

## ⚙️ Technical

- Attack path builder implemented with structured node and relationship models.
- PDF reporting integrated into the Attack Path Explorer workflow.
- Roadmap artwork served directly for consistent rendering.
- Labs asset organization and image rendering refined.

---

# 🚀 v1.6.1 — Carnet de Terrain Integration

## ✨ Nouveautés

- Intégration du Carnet de Terrain au sein des Notes de Terrain
- Nouveau composant éditorial "CarnetCTA"
- Invitation à l'abonnement directement après la conclusion des articles
- Design compact et cohérent avec l'identité visuelle du site

## 🎨 Améliorations

- Hiérarchie visuelle retravaillée
- Espacements optimisés
- Typographie simplifiée
- Intégration discrète dans le parcours de lecture

## 📚 Expérience utilisateur

- Le Carnet de Terrain devient le prolongement naturel des Notes de Terrain
- Affichage limité au dernier article publié afin de préserver une expérience de lecture épurée

---

# [1.6.0]

## 🚀 Carnet de Terrain Platform

Cette version marque une nouvelle étape dans l'évolution de **marcmichon.co**.

Le projet ne se limite désormais plus à publier des Notes de Terrain : il dispose désormais de sa propre plateforme éditoriale avec un système complet d'abonnement, de double validation (Double Opt-In), d'automatisation marketing et d'une expérience utilisateur entièrement intégrée.

Cette évolution pose les bases de la diffusion hebdomadaire du **Carnet de Terrain**, tout en garantissant une conformité RGPD complète et une expérience premium de bout en bout.

---

## ✨ Added

### 📬 Carnet de Terrain

- Official release of the **Carnet de Terrain** newsletter.
- Dedicated newsletter landing page.
- Premium newsletter Hero.
- Editorial signup component.
- Newsletter confirmation page.
- Premium subscription journey.
- Weekly editorial workflow.

### 🤖 Brevo Integration

- Full Brevo API integration.
- Double Opt-In workflow.
- Transactional email integration.
- Temporary subscriber list.
- Official subscriber list.
- Automatic subscriber migration.
- Automatic temporary list cleanup.
- Newsletter-ready infrastructure.

### ⚖️ Compliance

- GDPR compliant subscription workflow.
- Consent collection.
- Privacy Policy.
- Legal Notice.
- Cookie Policy.
- One-click unsubscribe support.

### 📝 Editorial

- New Note de Terrain published.
- New editorial components.
- Editorial data layer.
- Improved article categorization.
- Dedicated newsletter branding.

---

## 🎨 Changed

### User Experience

- Premium newsletter landing page.
- Premium confirmation experience.
- Refined confirmation page design.
- Improved homepage editorial call-to-actions.
- Improved Hero Premium component.
- Improved footer navigation.
- Harmonized typography.
- Improved editorial navigation.

### Visual Identity

- Dedicated Carnet de Terrain branding.
- Consistent editorial experience.
- Newsletter visual identity.
- Improved premium layout.

---

## ⚙️ Technical

- Astro API endpoint for subscriptions.
- Brevo service layer.
- Environment variable support.
- Wrangler configuration update.
- Secure secret management.
- Local development configuration.
- Improved project structure.

---

## 🔒 Security & Privacy

- Double Opt-In enabled.
- Proof of consent handled by Brevo.
- Secure API communication.
- Newsletter automation.
- GDPR-compliant subscriber lifecycle.

---

## 🐛 Fixed

- Newsletter confirmation flow.
- Subscription error handling.
- Editorial page consistency.
- Footer layout refinements.
- Responsive confirmation page.
- Hero spacing and typography improvements.

---

# [1.5.0]

## 🚀 MM Security Intelligence Suite reaches production maturity

Cette version marque une étape importante dans la maturité de la plateforme.

La MM Security Intelligence Suite évolue d'une collection de démonstrateurs vers une véritable suite d'outils d'aide à la décision destinée aux analystes, ingénieurs sécurité et RSSI.

Deux nouveaux produits rejoignent officiellement la plateforme tandis que l'ensemble de l'expérience utilisateur, des rapports PDF et de l'identité visuelle ont été profondément revus.

---

### ✨ Added

- Official release of **MM IOC Analyzer**.
- IOC normalization engine.
- IOC deduplication.
- IOC classification.
- Multi-format IOC extraction.
- Professional IOC PDF investigation report.

- Official release of **MM Password Generator**.
- Cryptographically secure password generation.
- Secure passphrase generation.
- Local entropy estimation.
- Password quality assessment.
- 100% client-side generation using `crypto.getRandomValues()`.

- New product artwork for every published application.
- Dedicated Utility visual identity.
- Dedicated Intelligence Apps visual identity.

---

### 🎨 Changed

- Complete redesign of the Labs page.
- New product card system.
- High-quality application illustrations.
- Improved navigation between tools.
- Consistent branding across the complete suite.

- MM Risk Score visual refresh.
- Password Generator aligned with the Risk Score design language.

- IOC Analyzer fully integrated into the product catalog.

---

### 🛡️ MM Vulnerability Explorer

The Vulnerability Explorer receives its largest evolution since its initial release.

#### Analysis Engine

- Improved operational prioritization.
- Improved executive decision engine.
- Smarter remediation recommendations.
- Context-aware operational guidance.
- Better confidence evaluation.
- Improved vulnerability qualification.

#### Operational Assessment

- New remediation resources section.
- Vendor advisory integration.
- Patch reference support.
- Improved business impact presentation.
- Cleaner operational evaluation layout.

#### User Experience

- Redesigned action cards.
- Better typography.
- Improved readability.
- Better information hierarchy.
- Cleaner engineering-oriented language.

#### PDF Reporting

- Complete redesign of the executive PDF report.
- New printable layout.
- Improved pagination.
- Better typography.
- Improved rendering quality.
- More executive-oriented presentation.

---

### 📄 IOC Analyzer

- Executive PDF investigation report.
- Multi-page printable report.
- Redesigned evidence presentation.
- Investigation workflow improvements.
- Better IOC normalization.

---

### ⚙️ Technical

- Multiple rendering optimizations.
- Sharper application previews.
- Improved image rendering.
- Better responsive behaviour.
- UI consistency improvements.
- Refactored report generation architecture.

---

### 🐛 Fixed

- Fixed image blurriness on Labs product cards.
- Fixed product image integration.
- Improved PDF rendering stability.
- Multiple layout corrections.
- Various typography fixes.

Cette version marque une étape importante dans la maturité de la plateforme.

Les notes de terrains s'étoffent avec chaque semaine une nouvelle note.

La MM Security Intelligence Suite évolue d'une collection de démonstrateurs vers une véritable suite d'outils d'aide à la décision destinée aux analystes, ingénieurs sécurité et RSSI.

Deux nouveaux produits rejoignent officiellement la plateforme tandis que l'ensemble de l'expérience utilisateur, des rapports PDF et de l'identité visuelle ont été profondément revus.

---

### ✨ Added

- Official release of **MM IOC Analyzer**.
- IOC normalization engine.
- IOC deduplication.
- IOC classification.
- Multi-format IOC extraction.
- Professional IOC PDF investigation report.

- Official release of **MM Password Generator**.
- Cryptographically secure password generation.
- Secure passphrase generation.
- Local entropy estimation.
- Password quality assessment.
- 100% client-side generation using `crypto.getRandomValues()`.

- New product artwork for every published application.
- Dedicated Utility visual identity.
- Dedicated Intelligence Apps visual identity.

---

### 🎨 Changed

- Complete redesign of the Labs page.
- New product card system.
- High-quality application illustrations.
- Improved navigation between tools.
- Consistent branding across the complete suite.

- MM Risk Score visual refresh.
- Password Generator aligned with the Risk Score design language.

- IOC Analyzer fully integrated into the product catalog.

---

### 🛡️ MM Vulnerability Explorer

The Vulnerability Explorer receives its largest evolution since its initial release.

#### Analysis Engine

- Improved operational prioritization.
- Improved executive decision engine.
- Smarter remediation recommendations.
- Context-aware operational guidance.
- Better confidence evaluation.
- Improved vulnerability qualification.

#### Operational Assessment

- New remediation resources section.
- Vendor advisory integration.
- Patch reference support.
- Improved business impact presentation.
- Cleaner operational evaluation layout.

#### User Experience

- Redesigned action cards.
- Better typography.
- Improved readability.
- Better information hierarchy.
- Cleaner engineering-oriented language.

#### PDF Reporting

- Complete redesign of the executive PDF report.
- New printable layout.
- Improved pagination.
- Better typography.
- Improved rendering quality.
- More executive-oriented presentation.

---

### 📄 IOC Analyzer

- Executive PDF investigation report.
- Multi-page printable report.
- Redesigned evidence presentation.
- Investigation workflow improvements.
- Better IOC normalization.

---

### ⚙️ Technical

- Multiple rendering optimizations.
- Sharper application previews.
- Improved image rendering.
- Better responsive behaviour.
- UI consistency improvements.
- Refactored report generation architecture.

---

### 🐛 Fixed

- Fixed image blurriness on Labs product cards.
- Fixed product image integration.
- Improved PDF rendering stability.
- Multiple layout corrections.
- Various typography fixes.

# [1.4.0] 

## 🎨 Birth of the MM Security Intelligence Suite

Cette version marque une évolution majeure de l'identité du projet.

Les différents outils interactifs sont désormais regroupés sous une identité commune : **MM Security Intelligence Suite**.

Cette évolution pose les bases d'une véritable suite d'analyse cybersécurité qui continuera de s'enrichir au fil des prochaines versions.

### Added

- Official introduction of the **MM Security Intelligence Suite** brand.
- Shared visual identity across all published security tools.
- Unified product naming strategy.

### Changed

- Complete redesign of the **MM Vulnerability Explorer** hero section.
- Harmonized branding for **MM CVSS Calculator**.
- Harmonized branding for **MM Risk Score**.
- Improved visual consistency across every published module.
- Updated project documentation to reflect the new product identity.

### Technical

- Standardized hero components.
- Unified typography across security tools.
- Simplified product naming for future extensibility.

---

# [1.3.0] 

## 🚀 MM Vulnerability Explorer

Le Vulnerability Explorer évolue d'un simple moteur de consultation de CVE vers un véritable assistant d'analyse des vulnérabilités.

L'objectif devient d'aider l'analyste à transformer une vulnérabilité brute en décision opérationnelle.

### Added

- Complete Vulnerability Explorer redesign.
- Executive report generation.
- Business impact assessment.
- Confidence assessment.
- Explainable decision engine.
- Operational response plan.
- Professional PDF report generation.
- Standardized reporting workflow.

### Internationalization

- Lightweight i18n architecture.
- French translation dictionaries.
- Localized interface.
- Localized PDF reports.
- French date formatting.
- French percentage formatting.
- French severity labels.
- French confidence labels.
- French analyst recommendations.

### Changed

- Complete user experience redesign.
- Improved readability of generated analyses.
- Harmonized terminology throughout the application.
- Enhanced report presentation.

### Fixed

- Fixed PDF export always using the first searched CVE.
- Fixed PDF export event binding after multiple searches.
- Improved confidence rendering.
- Improved report normalization.

---

# [1.2.0] 

## 🛡️ MM Risk Score

Première brique d'aide à la décision développée pour la plateforme.

Le MM Risk Score permet de produire rapidement une estimation contextualisée du niveau de risque à partir de plusieurs facteurs techniques et organisationnels.

### Added

- MM Risk Score.
- Risk calculation engine.
- Automatic scenario analysis.
- Risk factor identification.
- Compensating controls evaluation.
- Automatic recommendations.
- Copy analysis feature.

### Improved

- Responsive mobile experience.
- Mobile navigation.
- Homepage optimization.
- Overall UI refinements.

### Field Notes

Publication d'une nouvelle note de terrain.

- **Les exclusions : le risque silencieux des plateformes EDR**

---

# [1.1.0]

## 📊 MM CVSS Calculator

Premier outil interactif publié sur marcmichon.co.

Son objectif est de rendre le standard CVSS v4 plus accessible tout en respectant fidèlement les spécifications officielles du FIRST.

### Added

- Interactive CVSS v4 calculator.
- Graphical vector builder.
- Metric explanations.
- Official FIRST score calculation.
- Automatic vector generation.
- One-click vector copy.
- Responsive interface.

---

# [1.0.0]

## 🌍 First Public Release

Première publication officielle de **marcmichon.co**.

Le projet devient accessible publiquement avec une architecture évolutive destinée à accueillir progressivement des contenus techniques et des outils interactifs.

### Added

- Public homepage.
- Navigation system.
- Responsive layout.
- SEO optimization.
- Markdown publication engine.
- Initial Field Notes support.

---

# [0.9.0]

## 📝 Field Notes

Les **Field Notes** deviennent le cœur éditorial du projet.

Chaque publication est directement inspirée de problématiques rencontrées lors de missions, d'audits, d'investigations ou de projets réalisés en environnement réel.

L'objectif est de partager des méthodes, des retours d'expérience et des analyses directement exploitables plutôt que de produire un contenu purement théorique.

### Added

- Weekly Field Notes format.
- Technical article structure.
- Category organization.
- Article navigation.
- Reading improvements.

---

# [0.8.0]

## 🎨 Design System

Création de la première identité graphique du projet.

Cette étape pose les fondations visuelles qui serviront ensuite à l'ensemble de la plateforme.

### Added

- Color palette.
- Typography.
- Reusable UI components.
- Content cards.
- Responsive layouts.
- First UI animations.

---

# [0.7.0]

## 🏗️ Technical Foundation

Construction de l'architecture technique de marcmichon.co.

Cette version établit les bases permettant au projet de grandir durablement.

### Added

- Astro project initialization.
- Component architecture.
- Markdown content management.
- Routing.
- Asset organization.
- Scalable project structure.

---

# [0.1.0]

## 🌱 Project Genesis

Naissance de **marcmichon.co**.

L'idée de départ est simple :

Créer un espace personnel permettant de documenter des retours d'expérience issus du terrain, conserver des analyses techniques et partager des méthodes directement réutilisables lors de missions de cybersécurité.

Au fil des versions, ce simple carnet technique évoluera progressivement vers une plateforme articulée autour de deux piliers complémentaires :

- **Field Notes**, des retours d'expérience publiés régulièrement à partir de situations réelles ;
- **MM Security Intelligence Suite**, une collection d'outils interactifs destinés à faciliter l'analyse et la prise de décision en cybersécurité.

Le projet continue d'évoluer avec un objectif constant :

**Transformer l'expérience acquise sur le terrain en ressources et outils utiles à l'ensemble de la communauté cybersécurité.**