// hook principal — relie React, le canvas et la boucle de jeu
import { useEffect, useRef, useCallback, useState } from 'react';
import { GameState, InputState, GameOptions, ControlMode, DEFAULT_OPTIONS, OPTIONS_VERSION, PAUSE_BUTTONS } from './types';
import { makeInitialState } from './initialState';
import { update, startLevel } from './update';
import { render } from './renderer';
import { LOGICAL_WIDTH, LOGICAL_HEIGHT, TOUCH_AUTO_FIRE_INTERVAL } from './constants';
import { initSounds, initMusic, stopMusic, toggleMusic, getSfxVolume, getMusicVolume, setSfxVolume, setMusicVolume } from './sounds';
import { loadAssets, GameAssets } from './assets';

function loadOptions(): GameOptions {
  try {
    const raw = localStorage.getItem('pang_genesis_options');
    if (raw) {
      const parsed = JSON.parse(raw);
      // Migration v1 → v2 : classicMode boolean → controlMode string
      if (parsed._v === OPTIONS_VERSION) {
        return { ...DEFAULT_OPTIONS, ...parsed };
      }
      if (parsed._v === 1) {
        parsed.controlMode = parsed.classicMode ? 'classic' : 'overlay';
        delete parsed.classicMode;
        parsed._v = 2;
        return { ...DEFAULT_OPTIONS, ...parsed };
      }
    }
  } catch {}
  return { ...DEFAULT_OPTIONS };
}

function saveOptions(opts: GameOptions) {
  localStorage.setItem('pang_genesis_options', JSON.stringify(opts));
}

async function requestFullscreenAndLock() {
  try {
    if (document.documentElement.requestFullscreen) {
      await document.documentElement.requestFullscreen();
    }
    const o = (screen as any).orientation;
    if (o?.lock) {
      await o.lock('landscape');
    }
  } catch {}
}

export function useGame(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const initialSt = makeInitialState();
  const savedBest = localStorage.getItem('pang_genesis_best');
  if (savedBest) initialSt.bestScore = parseInt(savedBest, 10) || 0;
  const savedStars = localStorage.getItem('pang_genesis_stars');
  if (savedStars) {
    try { initialSt.levelStars = JSON.parse(savedStars); } catch {}
  }
  const savedScores = localStorage.getItem('pang_genesis_level_scores');
  if (savedScores) {
    try { initialSt.levelBestScores = JSON.parse(savedScores); } catch {}
  }
  const stateRef   = useRef<GameState>(initialSt);
  const inputRef   = useRef<InputState>({
    left: false, right: false, fire: false, fireHeld: false,
    mute: false, pause: false, enter: false, info: false,
    options: false, quit: false, resetLevel: false, resetFull: false, reset: false,
    touchTargetX: null, touchFireHeld: false,
    tiltGamma: 0,
  });
  const optionsRef = useRef<GameOptions>(loadOptions());
  const rafRef     = useRef<number>(0);
  const lastRef    = useRef<number>(0);
  const timeRef    = useRef<number>(0);
  const assetsRef  = useRef<GameAssets>({ backgrounds: [], loaded: false });
  const touchFireTimerRef = useRef<number>(0);
  const touchPosRef = useRef<{ x: number; y: number } | null>(null);
  const fullscreenAttemptedRef = useRef(false);
  const [muted, setMuted] = useState(false);
  const [audioReady, setAudioReady] = useState(false);
  const [sfxVol, setSfxVolState] = useState(getSfxVolume());
  const [musicVol, setMusicVolState] = useState(getMusicVolume());
  const [optionsVersion, setOptionsVersion] = useState(0);
  const [tiltEnabled, setTiltEnabled] = useState(false);

  const fitCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement!;
    const pw = parent.clientWidth;
    const ph = parent.clientHeight;
    const scale = Math.min(pw / LOGICAL_WIDTH, ph / LOGICAL_HEIGHT);
    const cw = Math.round(LOGICAL_WIDTH  * scale);
    const ch = Math.round(LOGICAL_HEIGHT * scale);
    canvas.style.width  = `${cw}px`;
    canvas.style.height = `${ch}px`;
    canvas.style.left   = `${(pw - cw) / 2}px`;
    canvas.style.top    = `${(ph - ch) / 2}px`;
  }, [canvasRef]);

  const saveProgress = useCallback((state: GameState) => {
    localStorage.setItem('pang_genesis_best', String(state.bestScore));
    localStorage.setItem('pang_genesis_stars', JSON.stringify(state.levelStars));
    localStorage.setItem('pang_genesis_level_scores', JSON.stringify(state.levelBestScores));
  }, []);

  const loop = useCallback((timestamp: number) => {
    const dt = Math.min((timestamp - lastRef.current) / 1000, 0.05);
    lastRef.current = timestamp;
    timeRef.current += dt;

    const canvas = canvasRef.current;
    if (!canvas) { rafRef.current = requestAnimationFrame(loop); return; }
    const ctx = canvas.getContext('2d');
    if (!ctx) { rafRef.current = requestAnimationFrame(loop); return; }

    // auto-fire continu pour le tir tactile
    if (inputRef.current.touchFireHeld) {
      touchFireTimerRef.current += dt;
      if (touchFireTimerRef.current >= TOUCH_AUTO_FIRE_INTERVAL) {
        inputRef.current.fire = true;
        touchFireTimerRef.current = 0;
        void initAudio();
      }
    } else {
      touchFireTimerRef.current = 0;
    }

    const input = { ...inputRef.current };
    inputRef.current.fire = false;
    inputRef.current.pause = false;
    inputRef.current.enter = false;
    inputRef.current.info = false;
    inputRef.current.options = false;
    inputRef.current.quit = false;
    inputRef.current.resetLevel = false;
    inputRef.current.resetFull = false;
    inputRef.current.reset = false;

    const state = stateRef.current;

    // Fermeture options via boutons pause/info (touch ou clavier)
    if (state.phase === 'options') {
      if (input.pause) { state.phase = state.prevPhase; input.pause = false; }
      if (input.info)  { state.phase = state.prevPhase; input.info = false; }
    }

    // Reset progression depuis l'écran titre
    if (input.reset && state.phase === 'title') {
      const keys = ['pang_genesis_best', 'pang_genesis_stars', 'pang_genesis_level_scores', 'pang_genesis_played', 'pang_genesis_options'];
      keys.forEach(k => localStorage.removeItem(k));
      const fresh = makeInitialState();
      state.bestScore = 0;
      state.maxLevelReached = 1;
      state.level = 1;
      state.levelStars = [];
      state.levelBestScores = [];
      state.score = 0;
      state.phase = 'title';
      state.player = fresh.player;
      state.difficulty = fresh.difficulty;
      optionsRef.current = { ...DEFAULT_OPTIONS };
      saveOptions(optionsRef.current);
      input.reset = false;
    }

    const prevBest = stateRef.current.bestScore;
    stateRef.current = update(stateRef.current, dt, input, optionsRef.current);
    if (stateRef.current.bestScore > prevBest) {
      saveProgress(stateRef.current);
    }

    render(ctx, stateRef.current, timeRef.current, assetsRef.current, optionsRef.current);

    // Feedback visuel joystick (cercle suiveur)
    if (touchPosRef.current && stateRef.current.phase === 'playing') {
      const p = touchPosRef.current;
      ctx.save();
      ctx.beginPath();
      ctx.arc(p.x, p.y, 18, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(100,200,255,0.3)';
      ctx.strokeStyle = 'rgba(100,200,255,0.7)';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = 'rgba(100,200,255,0.5)';
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(100,200,255,0.7)';
      ctx.fill();
      ctx.restore();
    }

    rafRef.current = requestAnimationFrame(loop);
  }, [canvasRef, saveProgress]);

  useEffect(() => {
    loadAssets().then(assets => {
      assetsRef.current = assets;
    }).catch(() => {
      assetsRef.current = { backgrounds: [], loaded: true };
    });
  }, []);

  const initAudio = useCallback(async () => {
    if (audioReady) return;
    await initSounds();
    await initMusic();
    setAudioReady(true);

    if (!fullscreenAttemptedRef.current) {
      fullscreenAttemptedRef.current = true;
      requestFullscreenAndLock();
    }
  }, [audioReady]);

  const toggleMute = useCallback(() => {
    setMuted(prev => {
      const next = !prev;
      toggleMusic(next);
      return next;
    });
  }, []);

  const handleSfxVol = useCallback((v: number) => {
    setSfxVolume(v);
    setSfxVolState(v);
  }, []);

  const handleMusicVol = useCallback((v: number) => {
    setMusicVolume(v);
    setMusicVolState(v);
  }, []);

  // Mise à jour des options
  const updateOptions = useCallback((partial: Partial<GameOptions>) => {
    optionsRef.current = { ...optionsRef.current, ...partial };
    saveOptions(optionsRef.current);
    setOptionsVersion(v => v + 1);
  }, []);

  // Gérer les choix de la boîte de confirmation
  const handleConfirm = useCallback((action: 'yes' | 'no' | 'cancel') => {
    const dialog = stateRef.current.confirmDialog;
    if (!dialog || !dialog.action) return;
    stateRef.current.confirmDialog = null;
    if (action === 'no' || action === 'cancel') return;

    const s = stateRef.current;
    s.phase = s.prevPhase as GameState['phase'];
    const level = s.level;
    const resetShared = () => {
      s.score = 0; s.combo = 0; s.comboTimer = 0; s.comboDisplay = 0;
      s.streak = 0; s.balls = []; s.hooks = []; s.powerUps = [];
      s.flashParticles = []; s.floaters = []; s.milestones = [];
      s.shake = { intensity: 0, duration: 0, elapsed: 0 };
      s.effects = { multishotTimer: 0, slowMoTimer: 0, shieldTimer: 0, scoreBoostTimer: 0, magnetTimer: 0 };
      s.player = makeInitialState().player;
      s.ballsPending = []; s.spawnTimer = 0; s.platforms = [];
      s.hooksFired = 0; s.hooksHit = 0; s.levelElapsed = 0; s.levelMaxCombo = 0;
      s.levelHits = 0;
    };
    if (dialog.action === 'quit') {
      saveProgress(s);
      resetShared();
      s.phase = 'title';
      s.level = 1;
      s.difficulty = makeInitialState().difficulty;
      return;
    }
    resetShared();
    if (dialog.action === 'resetFull') {
      s.player.lives = 3;
    }
    startLevel(s, level);
    s.phase = 'playing';
  }, [saveProgress]);

  const confirmChoice = useCallback((accept: boolean) => {
    handleConfirm(accept ? 'yes' : 'no');
  }, [handleConfirm]);

  // Convertir coordonnées écran → canvas logique
  const screenToCanvas = useCallback((clientX: number, clientY: number): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = LOGICAL_WIDTH / rect.width;
    const scaleY = LOGICAL_HEIGHT / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }, [canvasRef]);

  // Vérifier si un point logique est dans un rectangle
  const hitRect = (px: number, py: number, rx: number, ry: number, rw: number, rh: number) => {
    return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
  };

  // Handler principal pour les overlay zones tactiles
  const handleTouchZone = useCallback((zone: 'move' | 'fire', e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    const coords = screenToCanvas(e.clientX, e.clientY);
    if (!coords) return;

    const state = stateRef.current;
    const phase = state.phase;

    void initAudio();

    if (!window.matchMedia('(any-pointer: coarse)').matches) return;

    // Gestion des phases non-jeu
    if (phase !== 'playing' && phase !== 'paused' && phase !== 'options') {
      if (e.pointerType === 'touch' || e.pointerType === 'pen') {
        if (phase === 'title') {
          // Détecter le bouton tapé sur l'écran titre
          const maxLvl = state.maxLevelReached;
          if (coords.y >= 295 && coords.y < 330) {
            inputRef.current.fire = true;
          } else if (coords.y >= 330 && coords.y < 365 && maxLvl > 1) {
            inputRef.current.enter = true;
          } else if (coords.y >= 365 && coords.y < 400) {
            inputRef.current.options = true;
          } else if (coords.y >= 400 && coords.y < 435 && maxLvl > 1) {
            inputRef.current.reset = true;
          } else {
            inputRef.current.fire = true;
          }
        } else if (phase === 'levelselect') {
          // Navigation tactile : détecter quelle cellule est tapée
          const cols = 5, cellW = 120, cellH = 100, gap = 16;
          const gridW = cols * (cellW + gap) - gap;
          const startX = (LOGICAL_WIDTH - gridW) / 2;
          const startY = 140;
          const perPage = cols * 4;
          const page = Math.floor((state.level - 1) / perPage);
          const pageStart = page * perPage;
          const maxLvl = state.maxLevelReached;
          const pageEnd = Math.min(maxLvl, (page + 1) * perPage);

          let found = false;
          for (let i = pageStart; i < pageEnd; i++) {
            const col = (i - pageStart) % cols;
            const row = Math.floor((i - pageStart) / cols);
            const cx = startX + col * (cellW + gap);
            const cy = startY + row * (cellH + gap);
            if (hitRect(coords.x, coords.y, cx, cy, cellW, cellH)) {
              state.level = i + 1;
              inputRef.current.fire = true;
              found = true;
              break;
            }
          }
          if (!found) {
            // Zone du bas = retour titre
            if (coords.y > 520) {
              inputRef.current.enter = true;
            } else if (coords.x < LOGICAL_WIDTH / 2 && page > 0) {
              state.level = Math.max(1, state.level - perPage);
            } else if (coords.x >= LOGICAL_WIDTH / 2 && pageEnd < maxLvl) {
              state.level = Math.min(maxLvl, state.level + perPage);
            } else {
              inputRef.current.fire = true;
            }
          }
        } else {
          inputRef.current.fire = true;
          inputRef.current.enter = true;
        }
      }
      return;
    }
    if (phase === 'paused') {
      if (state.confirmDialog) {
        confirmChoice(coords.x < LOGICAL_WIDTH / 2);
        return;
      }
      const cx = LOGICAL_WIDTH / 2;
      for (const btn of PAUSE_BUTTONS) {
        const bx = cx - 130;
        if (hitRect(coords.x, coords.y, bx, btn.y, 260, btn.h)) {
          switch (btn.action) {
            case 'resume': inputRef.current.pause = true; break;
            case 'quit': stateRef.current.confirmDialog = { visible: true, message: 'Retourner au menu principal ?', action: 'quit' }; break;
            case 'resetLevel': stateRef.current.confirmDialog = { visible: true, message: 'Recommencer le niveau ?', action: 'resetLevel' }; break;
            case 'resetFull': stateRef.current.confirmDialog = { visible: true, message: 'Tout recommencer (vies aussi) ?', action: 'resetFull' }; break;
            case 'options': stateRef.current.prevPhase = 'paused'; inputRef.current.options = true; break;
          }
          return;
        }
      }
      return;
    }
    if (phase === 'options') {
      const opts = optionsRef.current;
      const row = Math.floor((coords.y - 75) / 30);
      if (row >= 0 && row < 6) {
        switch (row) {
          case 0: updateOptions({ invertZones: !opts.invertZones }); break;
          case 1: {
            const ratios = [0.3, 0.4, 0.5, 0.6, 0.7];
            const ci = ratios.indexOf(opts.zoneSplitRatio);
            updateOptions({ zoneSplitRatio: ratios[(ci + 1) % ratios.length] });
            break;
          }
          case 2: {
            const zones = [0, 10, 20, 30, 40, 50];
            const zi = zones.indexOf(opts.deadZonePx);
            updateOptions({ deadZonePx: zones[(zi + 1) % zones.length] });
            break;
          }
          case 3: {
            const modes: ControlMode[] = ['overlay', 'classic', 'tilt'];
            const ci = modes.indexOf(opts.controlMode);
            updateOptions({ controlMode: modes[(ci + 1) % modes.length] });
            break;
          }
          case 4: {
            const sensitivities = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
            const si = sensitivities.indexOf(opts.touchSensitivity);
            updateOptions({ touchSensitivity: sensitivities[(si + 1) % sensitivities.length] });
            break;
          }
          case 5: updateOptions({ chromeLess: !opts.chromeLess }); break;
        }
      }
      return;
    }
    // Phase playing
    if (zone === 'move') {
      inputRef.current.touchTargetX = coords.x;
      touchPosRef.current = coords;
    }
    if (zone === 'fire') {
      inputRef.current.fire = true;
      inputRef.current.touchFireHeld = true;
      touchPosRef.current = coords;
      (navigator as any).vibrate?.(8);
    }
  }, [screenToCanvas, canvasRef, initAudio, confirmChoice]);

  const handleTouchZoneEnd = useCallback((zone: 'move' | 'fire', e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    touchPosRef.current = null;
    if (zone === 'move') inputRef.current.touchTargetX = null;
    if (zone === 'fire') inputRef.current.touchFireHeld = false;
  }, []);

  // Gestion du bouton plein écran
  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      requestFullscreenAndLock();
    }
  }, []);

  useEffect(() => {
    // Cycle la valeur d'une option (direction : -1 ou +1)
    const cycleOption = (dir: number) => {
      const opts = optionsRef.current;
      const cursor = stateRef.current.optionsCursor;
      switch (cursor) {
        case 0: updateOptions({ invertZones: !opts.invertZones }); break;
        case 1: {
          const ratios = [0.3, 0.4, 0.5, 0.6, 0.7];
          const ci = ratios.indexOf(opts.zoneSplitRatio);
          const next = ((ci + dir) % ratios.length + ratios.length) % ratios.length;
          updateOptions({ zoneSplitRatio: ratios[next] });
          break;
        }
        case 2: {
          const zones = [0, 10, 20, 30, 40, 50];
          const zi = zones.indexOf(opts.deadZonePx);
          const next = ((zi + dir) % zones.length + zones.length) % zones.length;
          updateOptions({ deadZonePx: zones[next] });
          break;
        }
        case 3: {
          const modes: ControlMode[] = ['overlay', 'classic', 'tilt'];
          const ci = modes.indexOf(opts.controlMode);
          const next = ((ci + dir) % modes.length + modes.length) % modes.length;
          updateOptions({ controlMode: modes[next] });
          break;
        }
        case 4: {
          const sensitivities = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
          const si = sensitivities.indexOf(opts.touchSensitivity);
          const next = ((si + dir) % sensitivities.length + sensitivities.length) % sensitivities.length;
          updateOptions({ touchSensitivity: sensitivities[next] });
          break;
        }
        case 5: updateOptions({ chromeLess: !opts.chromeLess }); break;
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const phase = stateRef.current.phase;
      const k = e.key.toLowerCase();

      // Lettres (layout-independent avec e.key)
      if (k === 'm') { e.preventDefault(); toggleMute(); return; }
      if (k === 'p') { e.preventDefault(); inputRef.current.pause = true; return; }
      if (k === 'i') { e.preventDefault(); inputRef.current.info = true; return; }
      if (k === 'o') { e.preventDefault(); inputRef.current.options = true; return; }
      if (k === 'r' && phase === 'title') { e.preventDefault(); inputRef.current.reset = true; return; }

      // Navigation clavier dans l'écran options
      if (phase === 'options') {
        if (e.code === 'ArrowUp')   { e.preventDefault(); stateRef.current.optionsCursor = Math.max(0, stateRef.current.optionsCursor - 1); return; }
        if (e.code === 'ArrowDown') { e.preventDefault(); stateRef.current.optionsCursor = Math.min(5, stateRef.current.optionsCursor + 1); return; }
        if (e.code === 'ArrowLeft')  { e.preventDefault(); cycleOption(-1); return; }
        if (e.code === 'ArrowRight') { e.preventDefault(); cycleOption(1); return; }
        if (e.code === 'Space') { e.preventDefault(); cycleOption(1); return; }
        // Fermer
        if (e.code === 'Enter' || e.code === 'Escape' || k === 'o' || k === 'i' || k === 'p') {
          e.preventDefault();
          stateRef.current.phase = stateRef.current.prevPhase;
          return;
        }
        return; // bloquer les handlers génériques
      }

      // Navigation pause clavier
      if (phase === 'paused' && !stateRef.current.confirmDialog) {
        if (e.code === 'ArrowUp')   { e.preventDefault(); stateRef.current.pauseCursor = Math.max(0, stateRef.current.pauseCursor - 1); return; }
        if (e.code === 'ArrowDown') { e.preventDefault(); stateRef.current.pauseCursor = Math.min(4, stateRef.current.pauseCursor + 1); return; }
        if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') { e.preventDefault(); return; }
        if (e.code === 'Space' || e.code === 'Enter') {
          e.preventDefault();
          const btn = PAUSE_BUTTONS[stateRef.current.pauseCursor];
          if (btn) {
            switch (btn.action) {
              case 'resume': inputRef.current.pause = true; break;
              case 'quit': stateRef.current.confirmDialog = { visible: true, message: 'Retourner au menu principal ?', action: 'quit' }; break;
              case 'resetLevel': stateRef.current.confirmDialog = { visible: true, message: 'Recommencer le niveau ?', action: 'resetLevel' }; break;
              case 'resetFull': stateRef.current.confirmDialog = { visible: true, message: 'Tout recommencer (vies aussi) ?', action: 'resetFull' }; break;
              case 'options': stateRef.current.prevPhase = 'paused'; inputRef.current.options = true; break;
            }
          }
          return;
        }
        if (k === 'q') {
          e.preventDefault();
          stateRef.current.confirmDialog = { visible: true, message: 'Retourner au menu principal ?', action: 'quit' };
          return;
        }
      }

      // ─── Dialog confirmation — intercepte AVANT les handlers génériques ───
      if (stateRef.current.confirmDialog) {
        if (e.code === 'Enter' || e.code === 'Space' || e.code === 'ArrowRight') {
          e.preventDefault(); confirmChoice(true); return;
        }
        if (e.code === 'ArrowLeft') {
          e.preventDefault(); confirmChoice(false); return;
        }
        if (e.code === 'Escape') {
          e.preventDefault(); stateRef.current.confirmDialog = null; return;
        }
        return; // bloquer toute autre touche tant que le dialog est ouvert
      }

      // Touches code (layout-independent)
      if (e.code === 'ArrowLeft')  { e.preventDefault(); inputRef.current.left  = true; }
      if (e.code === 'ArrowRight') { e.preventDefault(); inputRef.current.right = true; }
      if (e.code === 'Space')      {
        e.preventDefault();
        inputRef.current.fire = true;
        inputRef.current.fireHeld = true;
        void initAudio();
      }
      if (e.code === 'Enter') {
        e.preventDefault();
        inputRef.current.enter = true;
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'ArrowLeft')  inputRef.current.left  = false;
      if (e.code === 'ArrowRight') inputRef.current.right = false;
      if (e.code === 'Space')      inputRef.current.fireHeld = false;
    };
    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        inputRef.current.fire = true;
        inputRef.current.fireHeld = true;
        void initAudio();
      }
    };
    const onMouseUp = (e: MouseEvent) => {
      if (e.button === 0) {
        inputRef.current.fireHeld = false;
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup',   onKeyUp);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup',   onMouseUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup',   onKeyUp);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup',   onMouseUp);
    };
    }, [initAudio, toggleMute, confirmChoice, updateOptions]);

  // Demande de permission accéléromètre (iOS 13+)
  const requestTiltPermission = useCallback(async () => {
    try {
      if (typeof DeviceOrientationEvent !== 'undefined' &&
          typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
        const result = await (DeviceOrientationEvent as any).requestPermission();
        if (result !== 'granted') return;
      }
      setTiltEnabled(true);
    } catch {}
  }, []);

  // Écouteur accéléromètre pour le mode inclinaison
  useEffect(() => {
    let smoothGamma = 0;
    const onOrientation = (e: DeviceOrientationEvent) => {
      if (e.gamma === null) return;
      smoothGamma = smoothGamma * 0.65 + e.gamma * 0.35;
      inputRef.current.tiltGamma = smoothGamma;
    };
    window.addEventListener('deviceorientation', onOrientation);
    return () => window.removeEventListener('deviceorientation', onOrientation);
  }, []);

  // Bouton retour Android
  useEffect(() => {
    const onPop = () => {
      const phase = stateRef.current.phase;
      if (phase === 'paused' || phase === 'options' || phase === 'info' || phase === 'levelselect') {
        if (stateRef.current.confirmDialog) {
          stateRef.current.confirmDialog = null;
        } else {
          stateRef.current.phase = stateRef.current.prevPhase;
        }
      }
    };
    window.addEventListener('popstate', onPop);
    // Push un état pour activer popstate
    history.pushState(null, '', window.location.href);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  useEffect(() => {
    fitCanvas();
    const ro = new ResizeObserver(fitCanvas);
    const parent = canvasRef.current?.parentElement;
    if (parent) ro.observe(parent);
    window.addEventListener('resize', fitCanvas);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', fitCanvas);
      stopMusic();
    };
  }, [fitCanvas, canvasRef]);

  useEffect(() => {
    lastRef.current = performance.now();
    rafRef.current  = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [loop]);

  const handleTouchLeft  = useCallback((down: boolean) => { inputRef.current.left  = down; void initAudio(); }, [initAudio]);
  const handleTouchRight = useCallback((down: boolean) => { inputRef.current.right = down; void initAudio(); }, [initAudio]);
  const handleTouchFire  = useCallback(() => { inputRef.current.fire = true; inputRef.current.fireHeld = true; void initAudio(); }, [initAudio]);
  const handleTouchFireUp = useCallback(() => { inputRef.current.fireHeld = false; }, []);

  // Boutons coin pause/info (tactile)
  const handleTouchPause = useCallback((e: React.PointerEvent) => {
    e.preventDefault(); e.stopPropagation();
    inputRef.current.pause = true;
    void initAudio();
  }, [initAudio]);
  const handleTouchInfo = useCallback((e: React.PointerEvent) => {
    e.preventDefault(); e.stopPropagation();
    inputRef.current.info = true;
    void initAudio();
  }, [initAudio]);

  return {
    handleTouchLeft, handleTouchRight, handleTouchFire, handleTouchFireUp,
    toggleMute, muted,
    sfxVol, musicVol, handleSfxVol, handleMusicVol,
    optionsRef, updateOptions, confirmChoice,
    handleTouchZone, handleTouchZoneEnd,
    toggleFullscreen,
    handleTouchPause, handleTouchInfo,
    stateRef,
    requestTiltPermission, tiltEnabled,
  };
}
