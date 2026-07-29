# Structure du projet — Pang Genesis

## Architecture

```
src/
├── game/
│   ├── renderer.ts            # Boucle de rendu principale + ré-exports
│   ├── render-utils.ts        # hexToRgb, roundRect
│   ├── render-entities.ts     # drawBallTrail, drawGlowCircle, drawPlayer, drawHook, drawPlatforms, drawPowerUps
│   ├── render-background.ts   # drawBackground, drawFloorCeiling, drawAmbient
│   ├── render-hud.ts          # drawHUD, drawHeart, drawStarsSummary
│   ├── render-overlays.ts     # drawOverlay, drawLevelSelect, drawPauseOverlay, drawOnboarding, drawMilestones, drawLevelIntro, drawFloaters
│   ├── update.ts              # Boucle de jeu : physique, collisions, transitions d'état, score
│   ├── levels.ts              # Profils de difficulté progressifs (100 niveaux)
│   ├── themes.ts              # Thèmes visuels (36 entrées, blocs de 6 niveaux)
│   ├── initialState.ts        # makeInitialState, makeBall, makeLevelBalls, makePlatforms
│   ├── types.ts               # Interfaces TypeScript (Ball, Platform, Hook, GameState, etc.)
│   ├── constants.ts           # Constantes de gameplay (vitesses, tailles, scores)
│   ├── powerups.ts            # Types, spawn, collection, effets des power-ups
│   ├── sounds.ts              # Synthèse audio procédurale (SFX + musique)
│   ├── particles.ts           # Particules et anneaux d'explosion
│   ├── animations.ts          # Animator, tweens, screen shake
│   ├── assets.ts              # Chargement des images de fond
│   └── useGame.ts             # Hook React : boucle rAF, entrées, localStorage, canvas fitting
├── App.tsx                    # Composant React racine (canvas + HUD volume)
├── App.css
└── main.tsx                   # Point d'entrée Vite
```

## Flux de rendu

1. `render()` efface le canvas, récupère le thème
2. Applique le screen shake
3. Dessine : fond → sol/plafond → ambiant → balles → plateformes → power-ups → grappins
4. Dessine le joueur, le HUD, les floaters
5. Restaure le contexte (shake)
6. Dessine les overlays (onboarding, levelup, milestones, pause, level select)
7. Dessine les particules par-dessus tout

## Flux de jeu

1. `useGame` → boucle `requestAnimationFrame`
2. Chaque frame : `update(state, dt, input)` → `render(ctx, state, time, assets)`
3. `update` traite : transitions → physique → collisions → score → persistence
4. `render` dessine l'état résultant
