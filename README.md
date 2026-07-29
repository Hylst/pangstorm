# Pang Genesis ⚡

Réinterprétation moderne du classique *Pang* (Ocean, Atari ST).  
Orbes rebondissantes, grappin, combos, 100 niveaux, synthwave néon.

**[Jouer en ligne](https://games.hylst.fr/pang_genesis/)**

## Stack

- **React 19** + **TypeScript 5.9** + **Vite 7**
- **Tailwind CSS 4** (UI minime)
- Canvas 2D pour le rendu jeu (800×600 logique)
- Audio 100% procédurale (synthèse WAV + Howler.js)
- Aucune dépendance runtime lourde
- **PWA** : service worker offline, installable sur écran d'accueil

## Features

- 100 niveaux à difficulté progressive continue
- Système de combo, étoiles, records par niveau
- 7 power-ups (multi-tir, ralenti, bouclier, bombe…)
- Plateformes cassables avec drops
- Bonus de hauteur, vélocité, précision
- Tirs limités optionnel (niveaux 60+)
- 36 thèmes visuels uniques, 5 fonds bitmap cyclant tous les 6 niveaux
- Persistance localStorage (score, étoiles, records, options)
- Sélection de niveau paginée
- **PWA** : installation, offline, splash screen paysage
- **Plein écran** : auto sur mobile, bouton sur desktop
- **Contrôles tactiles overlay** : zones transparentes, drag = déplacement, tap/hold = tir

## Contrôles

| Mode | Déplacement | Tir / Charger | Pause | Infos | Options |
|------|-------------|---------------|-------|-------|---------|
| **Clavier** | ← → | ESPACE (maintenir = charge) | P | I | O |
| **Souris** | — | Clic gauche (maintenir = charge) | P | I | O |
| **Tactile** | Zone gauche (drag) | Zone droite (tap = 1 tir, hold = auto) | ⏸️ bouton | ℹ️ bouton | Menu pause |

Configurable via le menu Options (touche O) : inversion des zones, taille de zone, zone morte, mode classique.

## Développement

```bash
npm install
npm run dev      # serveur de dev
npm run build    # build single-file HTML + PWA assets
npm run preview  # prévisualiser le build
```

Build produit `dist/` avec `index.html` (inlined JS/CSS), `manifest.json`, `sw.js`, icônes PWA, et `images/`.

## Structure

Voir [`docs/structure.md`](docs/structure.md) pour l'architecture complète.  
Voir [`docs/features.md`](docs/features.md) pour le détail des fonctionnalités.  
Voir [`CHANGELOG.md`](CHANGELOG.md) pour l'historique des versions.

## Licence

Projet personnel — aucun droit d'auteur sur le nom ou le concept original *Pang*.
