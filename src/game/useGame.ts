// hook principal — relie React, le canvas et la boucle de jeu
import { useEffect, useRef, useCallback, useState } from 'react';
import { GameState, InputState } from './types';
import { makeInitialState } from './initialState';
import { update } from './update';
import { render } from './renderer';
import { LOGICAL_WIDTH, LOGICAL_HEIGHT } from './constants';
import { initSounds, initMusic, stopMusic, toggleMusic, getSfxVolume, getMusicVolume, setSfxVolume, setMusicVolume } from './sounds';
import { loadAssets, GameAssets } from './assets';

export function useGame(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const initialSt = makeInitialState();
  const savedBest = localStorage.getItem('pang_genesis_best');
  if (savedBest) initialSt.bestScore = parseInt(savedBest, 10) || 0;
  // restaurer les étoiles sauvegardées
  const savedStars = localStorage.getItem('pang_genesis_stars');
  if (savedStars) {
    try { initialSt.levelStars = JSON.parse(savedStars); } catch {}
  }
  const stateRef  = useRef<GameState>(initialSt);
  const inputRef  = useRef<InputState>({ left: false, right: false, fire: false, fireHeld: false, mute: false, pause: false, enter: false });
  const rafRef    = useRef<number>(0);
  const lastRef   = useRef<number>(0);
  const timeRef   = useRef<number>(0);
  const assetsRef = useRef<GameAssets>({ backgrounds: [], loaded: false });
  const [muted, setMuted] = useState(false);
  const [audioReady, setAudioReady] = useState(false);
  const [sfxVol, setSfxVolState] = useState(getSfxVolume());
  const [musicVol, setMusicVolState] = useState(getMusicVolume());

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

  const loop = useCallback((timestamp: number) => {
    const dt = Math.min((timestamp - lastRef.current) / 1000, 0.05);
    lastRef.current = timestamp;
    timeRef.current += dt;

    const canvas = canvasRef.current;
    if (!canvas) { rafRef.current = requestAnimationFrame(loop); return; }
    const ctx = canvas.getContext('2d');
    if (!ctx) { rafRef.current = requestAnimationFrame(loop); return; }

    const input = { ...inputRef.current };
    inputRef.current.fire = false;
    inputRef.current.pause = false;
    inputRef.current.enter = false;
    const prevBest = stateRef.current.bestScore;
    stateRef.current = update(stateRef.current, dt, input);
    if (stateRef.current.bestScore > prevBest) {
      localStorage.setItem('pang_genesis_best', String(stateRef.current.bestScore));
    }

    render(ctx, stateRef.current, timeRef.current, assetsRef.current);

    rafRef.current = requestAnimationFrame(loop);
  }, [canvasRef]);

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

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'ArrowLeft')  { e.preventDefault(); inputRef.current.left  = true; }
      if (e.code === 'ArrowRight') { e.preventDefault(); inputRef.current.right = true; }
      if (e.code === 'Space')      {
        e.preventDefault();
        inputRef.current.fire = true;
        inputRef.current.fireHeld = true;
        void initAudio();
      }
      if (e.code === 'KeyM') {
        e.preventDefault();
        toggleMute();
      }
      if (e.code === 'KeyP') {
        e.preventDefault();
        inputRef.current.pause = true;
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
  }, [initAudio, toggleMute]);

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

  return {
    handleTouchLeft, handleTouchRight, handleTouchFire, handleTouchFireUp,
    toggleMute, muted,
    sfxVol, musicVol, handleSfxVol, handleMusicVol,
  };
}
