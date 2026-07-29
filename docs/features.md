# Fonctionnalités — Pang Genesis

## Gameplay

- **100 niveaux progressifs** : difficulté croissante continue (vitesse, gravité, homing, santé des balles, etc.)
- **Mécanique de grappin** : tirez un crochet vertical pour éclater les orbes
- **Système de combo** : enchaînez les éclatements sans attendre pour multiplier le score
- **Power-ups** : multi-tir, ralenti, bouclier, score ×2, aimant, bombe, vie bonus
- **Plateformes cassables** (dès niv. 8) : bloquent les balles, se brisent sous les tirs, peuvent dropper power-ups ou malus
- **Système de précision** : le taux de tirs réussis génère un bonus de fin de niveau
- **Bonus de hauteur** : les orbes éclatées proches du plafond rapportent plus
- **Bonus de vélocité** : les orbes rapides rapportent plus
- **Tirs limités** (dès niv. 60) : nombre de grappins maximum par niveau (indiqué dans le HUD)

## Progression

- **Difficulté par paliers doux** : ballCount +1/15 niv, speed +0.8%/niv, gravité +0.5%/niv
- **Nouveaux mécanismes à des seuils précis** : homing niv.12, split niv.28, ballHealth niv.25/55/85
- **3 étoiles par niveau** : 0 dégâts = 3★, 1 dégât = 2★, 2+ = 1★
- **Meilleur score** sauvegardé par niveau (localStorage)
- **Sélection de niveau** : grille paginée, accès à tous les niveaux débloqués

## Thèmes visuels

- **36 thèmes uniques** par niveau, répartis en blocs de 6
- **Bloc 0** (niv. 1-6) : fonds gradient pur (pas de bitmap)
- **Blocs bitmap** (niv. 7+) : 5 images de fond cyclant tous les 6 niveaux (Cité Néon, Magma, Jungle, Cristal, Nébuleuse)
- Chaque niveau a son propre nom, palette de couleurs, accent lumineux, description
- Étoiles scintillantes procédurales et particules ambiantes

## Audio

- **Synthèse procédurale** : tous les sons sont générés mathématiquement (SFX + musique)
- **SFX** : tir, éclatement, rebond, combo, power-up, nouvelle vie, niveau terminé, record, game over
- **Musique** : pistes générées avec mélodies, change à chaque niveau

## Contrôles

- **← →** : déplacement du vaisseau
- **ESPACE** : tirer le grappin (maintenir pour charger)
- **P** : pause
- **M** : muet
- **ENTRÉE** : sélection de niveau / retour au titre
- Tactile : boutons virtuels L/R/FIRE

## Scoring

| Élément | Formule |
|---|---|
| Base par balle | `BASE_SCORE[tier]` (100/250/600/1200) |
| Combo | × `combo` (×2 avec power-up scoreboost) |
| Difficulté | × `speedMultiplier` (+0.8%/niv) |
| Hauteur | × `(1 + 0.5 × (1 - hauteurRelative))` |
| Vélocité | × `(1 + 0.3 × min(|vy|/gravité, 1))` |
| Fin de niveau | + `500 × niveau × (1 + streak × 0.05)` |
| Sans dégât | + `1000 × niveau` |
| Précision | + `tauxHits × 200 × niveau` |
