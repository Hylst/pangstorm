# Changelog

## [2.1.0] 2026-08-03

### Ajoute

- Bouton Infos dans la barre du haut, ouvrant une modale avec la stack, les graphismes, la
  musique, les interactions (tir chargé), l'architecture et les algorithmes notables
  (balles qui se divisent par paliers, balles traqueuses, 7 power-ups, 5 thèmes). Étape 15
  du chantier de retrofit décrit dans `todo.md` racine du monorepo.

### Corrige

- 4 tirets longs (titre du jeu, commentaires de code, cette entrée de changelog) remplacés
  par des deux-points, points médians ou virgules, en conformité avec la règle du dépôt.

### Verifie

- Build propre, modale testée à l'ouverture/fermeture, aucune erreur console, aucun 404,
  aucun débordement horizontal en 390×844.

## [2.0.0] — 2026-07-29

### ✨ Nouvelles fonctionnalités

- **Contrôles tactiles overlay transparents** : zones gauche (déplacement par drag) et droite (tir tap/hold) superposées au canvas. 100% invisibles, l'écran de jeu reste intégralement visible.
- **Mouvement fluide par suivi du doigt** : le vaisseau suit exactement la position X du doigt sur la zone gauche. Zone morte configurable.
- **Tir continu sur zone droite** : tap = 1 tir, hold = auto-feu toutes les 250ms. Charge indépendante (touche Espace).
- **Menu Pause tactile** 4 boutons (Reprendre, Recommencer niveau, Recommencer complet, Quitter) avec boîte de confirmation OUI/NON (gauche/droite).
- **Menu Options** (touche O / bouton Options) : Inverser zones, Taille zone gauche, Zone morte, Mode classique.
- **Plein écran automatique** au premier tap sur mobile. Bouton ⛶ sur desktop.
- **Verrouillage paysage** via Screen Orientation API (chaîné après le plein écran).
- **PWA complète** : manifest.json, service worker avec cache offline, icônes 192×192 et 512×512, installation sur écran d'accueil.
- **Persistance des options** dans localStorage (`pang_genesis_options`).

### 🧰 Technique

- Ajout des types `GameOptions`, `PauseButton`, `ConfirmDialog` dans `types.ts`.
- Nouveaux champs dans `InputState` : `touchTargetX`, `touchFireHeld`, `options`, `quit`, `resetLevel`, `resetFull`.
- Nouveaux overlays canvas : `drawPauseButtons`, `drawConfirmDialog`, `drawOptionsOverlay`.
- Export de `startLevel` depuis `update.ts`.
- Service worker + manifest dans `public/` (préservés du singlefile par Vite).
- Icônes PWA générées depuis le favicon existant.

### 🐛 Bugs corrigés

- `onPointerMove` sur la zone fire provoquait un tir par frame (~60/s) au lieu d'être régulé par le timer 250ms.
- `confirmChoice` référencé avant sa déclaration (ordre des `useCallback`).
- Variables mortes ou imports inutilisés nettoyés.
- `deadZonePx` optionnel non appliqué dans le calcul de mouvement tactile.
- Fullscreen et orientation lock non chaînés (pouvait échouer en async).

### ⚠️ Régressions potentielles

- Les anciens boutons tactiles ◀ 🔥 ▶ ont été supprimés. Les overlays transparents les remplacent.
- Le skin `touch-controls` CSS ne fonctionne plus (boutons supprimés). Le remplacer par `touch-overlay`.
- Le mode classique (toggle dans Options) rétablit les boutons du bas.
