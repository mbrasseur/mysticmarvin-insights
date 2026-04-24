# MysticMarvin Insights — Redesign Spec
**Date:** 2026-04-24
**Scope:** Full visual redesign — dark teal theme, sidebar navigation, micro-interactions

---

## 1. Design Direction

Dark mode complet, centré sur la couleur signature MysticMarvin `#00c4b4` (teal). Les fonds sont teintés teal (pas bleu, pas violet). L'app doit ressembler à un outil pro d'observabilité — proche de Grafana dark ou Datadog, mais avec une identité couleur forte et reconnaissable.

---

## 2. Système de couleurs

### Fonds (teintés teal)

| Token | Valeur | Usage |
|-------|--------|-------|
| `--bg-deep` | `#060e0d` | Sidebar, topbar |
| `--bg-base` | `#0a1a18` | Fond général de la page |
| `--bg-surface` | `#0f2422` | Cards, panneaux |
| `--bg-elevated` | `#17332f` | Cards en hover, dropdowns |
| `--bg-hover` | `#1e403b` | État hover des lignes de tableau |

### Accent principal

| Token | Valeur | Usage |
|-------|--------|-------|
| `--teal` | `#00c4b4` | Couleur signature, CTAs, accents actifs |
| `--teal-light` | `#33d1c3` | Hover sur éléments teal |
| `--teal-dim` | `#009688` | Gradient secondaire, icône logo |
| `--teal-900` | `#003d38` | Fond des badges teal |
| `--teal-100` | `#80e8e0` | Texte sur fond très sombre |

### Statuts sémantiques

| Token | Valeur | Usage |
|-------|--------|-------|
| `--status-ok` | `#22c55e` | Hosts/VMs sains, badge "Prêt" |
| `--status-warn` | `#f59e0b` | Dégradé (yellow hosts) |
| `--status-danger` | `#ef4444` | Alertes critiques, hosts red |
| `--status-info` | `#38bdf8` | Informationnel neutre |
| `--warn` | `#ef4444` | Valeurs warn dans Fleet Banner |

### Texte

| Token | Valeur | Usage |
|-------|--------|-------|
| `--text-primary` | `#ffffff` | Titres, valeurs KPI |
| `--text-secondary` | `rgba(255,255,255,0.55)` | Labels, descriptions |
| `--text-muted` | `rgba(255,255,255,0.30)` | Métadonnées, sous-labels |
| `--border` | `rgba(0,196,180,0.2)` | Bordures principales |
| `--border-subtle` | `rgba(255,255,255,0.07)` | Séparateurs discrets |

---

## 3. Typographie

Police inchangée : **Inter** (corps) + **JetBrains Mono** (valeurs numériques).

Échelle réduite de 12 tailles à **6** :

| Token | Taille | Usage |
|-------|--------|-------|
| `--text-xs` | `10px` | Labels uppercase, metadata |
| `--text-sm` | `12px` | Contenu table, badges |
| `--text-base` | `13px` | Corps principal, boutons |
| `--text-md` | `16px` | Titres de section |
| `--text-lg` | `20px` | KPIs Fleet Banner |
| `--text-xl` | `24px` | Titres de page |

Supprimer le `9px` — remplacer par `10px` partout.

---

## 4. Layout — App Shell

### Topbar (hauteur 48px)
- Fond `--bg-deep`, bordure bas `1px solid var(--border)`
- Logo : carré 26px gradient teal→teal-dim, lettre "M" en `--bg-deep`
- Nom "MysticMarvin" blanc + "Insights" en `--teal` atténué
- Sur la page Report : breadcrumb projet + sélecteur de scope (dropdown) à droite

### Sidebar (largeur 48px, fixe)
- Fond `--bg-deep`, bordure droite `1px solid rgba(0,196,180,0.15)`
- 5 icônes : Overview, Infrastructure, VMs, Lifecycle, Next Steps
- Icône active : fond `rgba(0,196,180,0.15)` + bordure + indicateur barre gauche `2px solid var(--teal)`
- Icônes inactives : `opacity: 0.35`, hover → `opacity: 0.7` + fond `--bg-elevated`
- Tooltip au hover (attribut `title`) avec le nom de la section

### Zone contenu
- Fond `--bg-base`, padding `20px 24px`
- Largeur max non contrainte (full width moins sidebar)

---

## 5. Page Home — Liste des projets

### Structure
- Topbar standard
- Zone centrage max `720px`
- En-tête : titre "Projets" + sous-titre + bouton "Nouveau" (gradient teal)

### Carte projet (état : données disponibles)
- Fond `--bg-surface`, bordure `rgba(0,196,180,0.3)`, radius `10px`
- Icône dossier 34×34px avec fond gradient teal transparent
- Nom du projet en `--text-primary`, 11px semibold
- Métadonnées : `{n} VMs · {n} Hosts · {n} fichiers` en teal pour les VMs, muted pour le reste
- Badge "Prêt" : fond `rgba(0,196,180,0.15)`, texte teal, border teal
- Chevron `›` à droite
- **Hover** : `transform: translateY(-1px)`, bordure → `rgba(0,196,180,0.5)`, transition `0.15s`

### Carte projet (état : vide)
- Fond `--bg-surface`, bordure `rgba(255,255,255,0.07)`, `opacity: 0.7`
- Badge "Vide" gris

### Ajout de projet
- Zone pointillée teal en bas de liste
- Au clic : input inline avec animation slide-down (pas de navigation)
- Confirmation : touche Entrée ou bouton "Créer"

### Suppression inline (remplace `confirm()`)
- Clic sur Trash2 → panneau rouge apparaît sous la carte (slide-down `0.2s`)
- Boutons "Supprimer" (rouge) + "Annuler" (X)
- Déjà implémenté dans la session courante — conserver le comportement, adapter le style

---

## 6. Page Project — Import de fichiers

### Zone de drop
- Fond `--bg-surface`, bordure `2px dashed rgba(0,196,180,0.25)`
- Drag-over : bordure `var(--teal)`, fond `rgba(0,196,180,0.06)`
- Bouton "Browse files" : gradient teal, texte `--bg-deep`

### État parsing
- Spinner SVG animé (rotation CSS) à gauche du texte "Parsing files…"
- Pas de blocage du reste de l'UI

### Ligne fichier importé
- Icône `FileSpreadsheet` en `--teal`
- Bouton Trash2 avec `aria-label` (déjà fait) — adapter la couleur hover → `--status-danger`

---

## 7. Page Report

### Fleet Banner (remplace le bandeau actuel)
- Fond `linear-gradient(150deg, var(--bg-deep) 0%, var(--bg-base) 100%)`
- Bordure bas `2px solid var(--teal)`
- KPIs en JetBrains Mono, valeurs blanches sauf alertes (`--status-danger`) et dégradés (`--status-warn`)
- Pas de changement fonctionnel

### Sélecteur de scope
- Déplacé dans le topbar (dropdown compact)
- Suppression du ScopeBar horizontal actuel (gagne de la hauteur écran)

### Sidebar de navigation (nouvelle)
- Remplace la tab bar horizontale actuelle
- 5 icônes SVG custom ou Lucide : BarChart2, Layers, Monitor, Clock, Lightbulb
- Indicateur actif : barre 2px gauche animée (`transition: top 0.2s`)

### Contenu des tabs
- Chaque tab reçoit les nouvelles classes `.card`, `.data-table`, `.badge-*`, `.section-header`
- Fond des cards → `--bg-surface`
- En-têtes de tableau → fond `--bg-base`, texte `--text-muted` uppercase 10px
- Lignes hover → fond `--bg-hover`

---

## 8. Micro-interactions

| Élément | Interaction | Détail |
|---------|-------------|--------|
| Cartes projet | Hover | `translateY(-1px)` + bordure plus lumineuse, `transition: 0.15s` |
| Sidebar icônes | Hover | `opacity: 0.35 → 0.7` + fond `--bg-elevated`, `transition: 0.12s` |
| Sidebar indicateur actif | Changement de tab | Barre gauche slide verticalement, `transition: 0.2s ease` |
| Boutons CTA | Hover | `filter: brightness(1.1)`, `transition: 0.12s` |
| Lignes de tableau | Hover | Fond `--bg-hover`, `transition: 0.1s` |
| Suppression projet | Apparition panneau | Slide-down `max-height 0 → auto`, `transition: 0.2s` |
| Parsing en cours | Feedback | Spinner CSS rotatif à côté du texte |
| Focus | Navigation clavier | Ring `2px solid var(--teal)` sur tout élément interactif (déjà en place) |

---

## 9. Composants CSS à mettre à jour

Les classes suivantes dans `theme.css` doivent adopter les nouveaux tokens :

- `.card` → fond `--bg-surface`, shadow supprimée (remplacée par bordure `--border-subtle`)
- `.badge-green` → fond `rgba(34,197,94,0.12)`, texte `#22c55e`
- `.badge-red` → fond `rgba(239,68,68,0.12)`, texte `#ef4444`
- `.badge-yellow` → fond `rgba(245,158,11,0.12)`, texte `#f59e0b`
- `.data-table th` → fond `--bg-base`, texte `--text-muted`
- `.data-table tr:hover td` → fond `--bg-hover`
- `.section-header` → bordure bas `rgba(0,196,180,0.15)`
- `.alert-red` → fond `rgba(239,68,68,0.1)`, bordure `--status-danger`
- `.alert-yellow` → fond `rgba(245,158,11,0.1)`, bordure `--status-warn`

---

## 10. Fichiers impactés

| Fichier | Nature du changement |
|---------|---------------------|
| `src/theme.css` | Réécriture complète des tokens + classes composants |
| `src/components/Layout.jsx` | Nouveau topbar (logo, scope dropdown), sidebar avec indicateur animé |
| `src/pages/Home.jsx` | Nouveau style cartes, ajout project inline, polish delete |
| `src/pages/Project.jsx` | Zone drop redesignée, spinner parsing |
| `src/pages/Report.jsx` | Suppression ScopeBar, scope dans topbar, Fleet Banner revu |
| `src/pages/report/*.jsx` | Adoption classes CSS, suppression inline styles redondants |
| `src/components/report/StatusBadge.jsx` | Nouveaux tokens badge dark |
| `src/components/report/charts.jsx` | Palette de couleurs alignée sur tokens |

---

## 11. Ce qui ne change pas

- Logique de parsing (VHST / RVTools)
- Structure des données (`useScopedData`, `aggregateFleet`)
- Routing
- `ErrorBoundary` (déjà en place)
- `aria-label` sur les boutons icônes (déjà en place)
