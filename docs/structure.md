# Structure du projet — Pang Genesis

## Architecture

```
├── public/                    # Copié tel quel dans dist/
│   ├── manifest.json          # PWA manifest (standalone, landscape)
│   ├── sw.js                  # Service worker (cache offline)
│   ├── icon-192.png           # Icône PWA 192x192
│   ├── icon-512.png           # Icône PWA 512x512
│   └── images/                # Backgrounds bitmap (bg_level1-5.webp)
├── src/
│   ├── game/
│   │   ├── renderer.ts            # Boucle de rendu principale + ré-exports
│   │   ├── render-utils.ts        # hexToRgb, roundRect
│   │   ├── render-entities.ts     # drawBallTrail, drawGlowCircle, drawPlayer, drawHook, drawPlatforms, drawPowerUps
│   │   ├── render-background.ts   # drawBackground, drawFloorCeiling, drawAmbient
│   │   ├── render-hud.ts          # drawHUD, drawHeart, drawStarsSummary
│   │   ├── render-overlays.ts     # drawOverlay, drawLevelSelect, drawPauseOverlay, drawOnboarding, drawMilestones, drawLevelIntro, drawFloaters, drawConfirmDialog, drawOptionsOverlay
│   │   ├── update.ts              # Boucle de jeu : physique, collisions, transitions d'état, score
│   │   ├── levels.ts              # Profils de difficulté progressifs (100 niveaux)
│   │   ├── themes.ts              # Thèmes visuels (36 entrées, blocs de 6 niveaux)
│   │   ├── initialState.ts        # makeInitialState, makeBall, makeLevelBalls, makePlatforms
│   │   ├── types.ts               # Interfaces TypeScript (Ball, Platform, Hook, GameState, InputState, GameOptions, ConfirmDialog, etc.)
│   │   ├── constants.ts           # Constantes de gameplay (vitesses, tailles, scores, auto-fire)
│   │   ├── powerups.ts            # Types, spawn, collection, effets des power-ups
│   │   ├── sounds.ts              # Synthèse audio procédurale (SFX + musique)
│   │   ├── particles.ts           # Particules et anneaux d'explosion
│   │   ├── animations.ts          # Animator, tweens, screen shake
│   │   ├── assets.ts              # Chargement des images de fond
│   │   └── useGame.ts             # Hook React : boucle rAF, entrées tactiles/clavier/souris, localStorage, fullscreen, orientation lock, canvas fitting
│   ├── App.tsx                    # Composant React racine (canvas + overlay zones tactiles + volume)
│   └── main.tsx                   # Point d'entrée Vite
├── CHANGELOG.md               # Historique des versions
├── index.html                 # Page d'accueil (meta PWA, SW registration)
├── vite.config.ts             # Vite + react + tailwind + viteSingleFile
└── README.md
```

## Flux de rendu

1. `render()` efface le canvas, récupère le thème
2. Applique le screen shake
3. Dessine : fond → sol/plafond → ambiant → balles → plateformes → power-ups → grappins
4. Dessine le joueur, le HUD, les floaters
5. Restaure le contexte (shake)
6. Dessine les overlays (onboarding, levelup, milestones, pause, level select, info, options)
7. Dessine les particules par-dessus tout

## Flux de jeu

1. `useGame` → boucle `requestAnimationFrame`
2. Chaque frame : `update(state, dt, input, options)` → `render(ctx, state, time, assets, options)`
3. `update` traite : transitions → entrées (clavier/souris/tactile) → physique → collisions → score → persistence
4. `render` dessine l'état résultant

## Entrées

| Source | Handler | Stockage |
|--------|---------|----------|
| Clavier (keydown/keyup) | `useEffect` dans `useGame.ts` | `inputRef.current` |
| Souris (mousedown/mouseup) | `useEffect` dans `useGame.ts` | `inputRef.current` |
| Tactile (overlay zones) | `handleTouchZone` / `handleTouchZoneEnd` | `inputRef.current` |
| Auto-fire tactile | Timer dans `loop()` toutes les 250ms | `inputRef.current.fire` |
