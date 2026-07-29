import { useRef, useCallback, useEffect, useState } from 'react';
import { useGame } from './game/useGame';
import { LOGICAL_WIDTH, LOGICAL_HEIGHT } from './game/constants';
import { PAUSE_BUTTONS, ControlMode, OPTIONS_ROWS_TOP, OPTIONS_ROW_SPACING, OPTIONS_ROW_COUNT, OPTIONS_ROW_W } from './game/types';

function VolumeSlider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ color: 'rgba(200,220,255,0.6)', fontSize: 11, fontFamily: '"Courier New", monospace', minWidth: 30 }}>
        {label}
      </span>
      <input
        type="range"
        min="0"
        max="1"
        step="0.05"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ width: 60, height: 4, accentColor: '#4488ff', cursor: 'pointer' }}
      />
    </div>
  );
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasTouch, setHasTouch] = useState(false);
  const [hasKeyboard, setHasKeyboard] = useState(false);
  // Masque le hint statique (Feu/Dir) pendant qu'un doigt est réellement posé sur la
  // zone, pour ne jamais l'afficher en même temps que le joystick/cercle de tir
  // dessiné sur le canvas (sinon doublon visuel — cf. retour utilisateur).
  const [fireActive, setFireActive] = useState(false);
  const [moveActive, setMoveActive] = useState(false);

  useEffect(() => {
    const touchMq = window.matchMedia('(any-pointer: coarse)');
    const keyboardMq = window.matchMedia('(any-pointer: fine)');
    setHasTouch(touchMq.matches);
    setHasKeyboard(keyboardMq.matches);
    const onTouchChange = (e: MediaQueryListEvent) => setHasTouch(e.matches);
    const onKeyboardChange = (e: MediaQueryListEvent) => setHasKeyboard(e.matches);
    touchMq.addEventListener('change', onTouchChange);
    keyboardMq.addEventListener('change', onKeyboardChange);
    return () => {
      touchMq.removeEventListener('change', onTouchChange);
      keyboardMq.removeEventListener('change', onKeyboardChange);
    };
  }, []);

  const {
    toggleMute, muted,
    sfxVol, musicVol, handleSfxVol, handleMusicVol,
    handleTouchZone, handleTouchZoneEnd,
    optionsRef, updateOptions, toggleFullscreen,
    handleTouchPause, handleTouchInfo,
    stateRef, requestTiltPermission, tiltEnabled,
    confirmChoice, phaseVersion,
  } = useGame(canvasRef);

  const getZoneStyle = useCallback((side: 'left' | 'right'): React.CSSProperties => {
    const opts = optionsRef.current;
    if (opts.controlMode === 'tilt') {
      return {
        position: 'absolute',
        top: 0,
        [side]: 0,
        width: '50%',
        height: '100%',
        touchAction: 'none',
        userSelect: 'none',
        zIndex: 10,
      };
    }
    const splitRatio = opts.controlMode === 'classic' ? 0.5 : (opts.invertZones ? 1 - opts.zoneSplitRatio : opts.zoneSplitRatio);
    const leftPct = side === 'left' ? `${splitRatio * 100}%` : `${(1 - splitRatio) * 100}%`;
    return {
      position: 'absolute',
      top: 0,
      [side]: 0,
      width: leftPct,
      height: '100%',
      touchAction: 'none',
      userSelect: 'none',
      zIndex: 10,
    };
  }, [optionsRef]);

  const btnStyle: React.CSSProperties = {
    background: 'rgba(80,120,255,0.22)', border: '2px solid rgba(100,160,255,0.45)',
    boxShadow: '0 0 18px rgba(80,120,255,0.3)', borderRadius: '50%',
    width: 96, height: 96, color: '#cceeff', fontSize: 20, fontWeight: 'bold',
    cursor: 'pointer', touchAction: 'none', userSelect: 'none',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  };

  const mode = optionsRef.current.controlMode;
  const isOverlay = mode === 'overlay';
  const isClassic = mode === 'classic';
  const isTilt = mode === 'tilt';
  // Pause/Options ont leur propre surcouche tactile plein écran (z-index 15) :
  // les commandes de jeu doivent rester cachées et inertes en dessous.
  const menuOpen = stateRef.current.phase === 'paused' || stateRef.current.phase === 'options';

  const fireIndicator = (
    <div style={{ position: 'absolute', bottom: 16, left: 20, zIndex: 11, pointerEvents: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, opacity: fireActive ? 0 : 1, transition: 'opacity 120ms ease' }}>
      <span style={{ fontFamily: '"Courier New", monospace', fontSize: 9, color: 'rgba(255,150,150,0.7)', textTransform: 'uppercase', letterSpacing: 1 }}>Feu</span>
      <div style={{ width: 72, height: 72, borderRadius: '50%', border: '2px solid rgba(255,80,80,0.5)', background: 'radial-gradient(circle, rgba(255,60,60,0.35), transparent 70%)' }} />
    </div>
  );

  return (
    <div
      style={{
        width: '100vw',
        height: '100dvh',
        background: '#000',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: LOGICAL_WIDTH,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 16px',
          flexShrink: 0,
        }}
        className="top-bar"
        hidden={optionsRef.current.chromeLess || false}
      >
        <span
          style={{
            fontFamily: '"Courier New", monospace',
            fontWeight: 'bold',
            color: '#88aaff',
            fontSize: 14,
            letterSpacing: 2,
          }}
        >
          PANG GENESIS <span style={{ color: 'rgba(120,140,200,0.6)', fontWeight: 'normal' }}>— Hylst</span>
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <VolumeSlider label="SFX" value={sfxVol} onChange={handleSfxVol} />
            <VolumeSlider label="MUS" value={musicVol} onChange={handleMusicVol} />
          </div>

          <button
            onClick={toggleMute}
            style={{
              background: 'rgba(80,120,255,0.18)',
              border: '1px solid rgba(100,160,255,0.35)',
              color: '#c0d8ff',
              borderRadius: 8,
              padding: '4px 10px',
              fontSize: 12,
              fontFamily: '"Courier New", monospace',
              cursor: 'pointer',
            }}
          >
            {muted ? '🔇' : '🔊'}
          </button>

          <button
            onClick={toggleFullscreen}
            style={{
              background: 'rgba(80,120,255,0.18)',
              border: '1px solid rgba(100,160,255,0.35)',
              color: '#c0d8ff',
              borderRadius: 8,
              padding: '4px 10px',
              fontSize: 12,
              fontFamily: '"Courier New", monospace',
              cursor: 'pointer',
            }}
          >
            ⛶
          </button>
        </div>
      </div>

      <div
        style={{
          position: 'relative',
          width: '100%',
          flex: 1,
          overflow: 'hidden',
        }}
      >
        <canvas
          ref={canvasRef}
          width={LOGICAL_WIDTH}
          height={LOGICAL_HEIGHT}
          style={{
            position: 'absolute',
            imageRendering: 'pixelated',
          }}
        />

        {/* Zones overlay (fire left + joystick right) */}
        {hasTouch && isOverlay && !menuOpen && (
          <div className="touch-overlay" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
            <div
              style={getZoneStyle('left')}
              onPointerDown={(e) => { setFireActive(true); handleTouchZone('fire', e); }}
              onPointerUp={(e) => { setFireActive(false); handleTouchZoneEnd('fire', e); }}
              onPointerLeave={(e) => { setFireActive(false); handleTouchZoneEnd('fire', e); }}
              onPointerCancel={(e) => { setFireActive(false); handleTouchZoneEnd('fire', e); }}
            />
            <div
              style={getZoneStyle('right')}
              onPointerDown={(e) => { setMoveActive(true); handleTouchZone('move', e); }}
              onPointerMove={(e) => handleTouchZone('move', e)}
              onPointerUp={(e) => { setMoveActive(false); handleTouchZoneEnd('move', e); }}
              onPointerLeave={(e) => { setMoveActive(false); handleTouchZoneEnd('move', e); }}
              onPointerCancel={(e) => { setMoveActive(false); handleTouchZoneEnd('move', e); }}
            />
            {fireIndicator}
            <div style={{ position: 'absolute', bottom: 16, right: 20, zIndex: 11, pointerEvents: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, opacity: moveActive ? 0 : 1, transition: 'opacity 120ms ease' }}>
              <span style={{ fontFamily: '"Courier New", monospace', fontSize: 9, color: 'rgba(150,200,255,0.7)', textTransform: 'uppercase', letterSpacing: 1 }}>Dir</span>
              <div style={{ width: 88, height: 88, borderRadius: '50%', border: '2px solid rgba(100,180,255,0.5)', background: 'radial-gradient(circle, rgba(60,140,255,0.35), transparent 70%)' }} />
              <div style={{ position: 'absolute', top: 4, width: 20, height: 20, borderRadius: '50%', background: 'rgba(180,220,255,0.6)', boxShadow: '0 0 8px rgba(100,180,255,0.5)' }} />
            </div>
          </div>
        )}

        {/* Mode classique : boutons du bas */}
        {hasTouch && isClassic && !menuOpen && (
          <div style={{ position: 'absolute', bottom: 14, left: 0, right: 0, display: 'flex', justifyContent: 'space-between', padding: '0 20px', zIndex: 11 }}>
            <button style={btnStyle} onPointerDown={(e) => { e.preventDefault(); handleTouchZone('move', e); }} onPointerUp={(e) => handleTouchZoneEnd('move', e)} onPointerLeave={(e) => handleTouchZoneEnd('move', e)}>◀</button>
            <button style={{ ...btnStyle, width: 112, height: 112, fontSize: 24 }} onPointerDown={(e) => { e.preventDefault(); handleTouchZone('fire', e); }} onPointerLeave={(e) => handleTouchZoneEnd('fire', e)} onPointerUp={(e) => handleTouchZoneEnd('fire', e)}>🔥</button>
            <button style={btnStyle} onPointerDown={(e) => { e.preventDefault(); handleTouchZone('move', e); }} onPointerUp={(e) => handleTouchZoneEnd('move', e)} onPointerLeave={(e) => handleTouchZoneEnd('move', e)}>▶</button>
          </div>
        )}

        {/* Mode inclinaison : les deux côtés tirent, l'inclinaison déplace */}
        {hasTouch && isTilt && !menuOpen && (
          <div className="touch-overlay" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
            <div
              style={getZoneStyle('left')}
              onPointerDown={(e) => handleTouchZone('fire', e)}
              onPointerUp={(e) => handleTouchZoneEnd('fire', e)}
              onPointerLeave={(e) => handleTouchZoneEnd('fire', e)}
              onPointerCancel={(e) => handleTouchZoneEnd('fire', e)}
            />
            <div
              style={getZoneStyle('right')}
              onPointerDown={(e) => handleTouchZone('fire', e)}
              onPointerUp={(e) => handleTouchZoneEnd('fire', e)}
              onPointerLeave={(e) => handleTouchZoneEnd('fire', e)}
              onPointerCancel={(e) => handleTouchZoneEnd('fire', e)}
            />
            {fireIndicator}
            <div style={{ position: 'absolute', bottom: 16, right: '25%', transform: 'translateX(50%)', zIndex: 11, pointerEvents: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <span style={{ fontFamily: '"Courier New", monospace', fontSize: 9, color: 'rgba(150,255,150,0.7)', textTransform: 'uppercase', letterSpacing: 1 }}>Incliner</span>
              <div style={{ width: 88, height: 88, borderRadius: '50%', border: '2px solid rgba(100,255,180,0.5)', background: 'radial-gradient(circle, rgba(60,255,140,0.35), transparent 70%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, color: 'rgba(150,255,200,0.7)' }}>↻</div>
              {!tiltEnabled && (
                <button
                  onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); requestTiltPermission(); }}
                  style={{ fontFamily: '"Courier New", monospace', fontSize: 10, color: '#ffdd00', background: 'rgba(255,220,0,0.15)', border: '1px solid rgba(255,220,0,0.4)', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', pointerEvents: 'auto', marginTop: 4 }}
                >
                  Activer l'inclinaison
                </button>
              )}
            </div>
          </div>
        )}

        {/* Surcouche pause tactile — z-index au-dessus des zones, en dessous de orientation-prompt */}
        {hasTouch && stateRef.current.phase === 'paused' && (
          <div
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 15, touchAction: 'none', background: 'transparent' }}
            onPointerDown={(e) => {
              e.preventDefault();
              const rect = canvasRef.current?.getBoundingClientRect();
              if (!rect) return;
              const sx = LOGICAL_WIDTH / rect.width;
              const sy = LOGICAL_HEIGHT / rect.height;
              const cx = (e.clientX - rect.left) * sx;
              const cy = (e.clientY - rect.top) * sy;
              const phase = stateRef.current.phase;
              const confirm = stateRef.current.confirmDialog;
              (window as any).__touchDbg = { count: (window as any).__touchDbg?.count ?? 0, x: Math.round(cx), y: Math.round(cy), hit: 'start' };
              if (phase === 'paused') {
                if (confirm) {
                  (window as any).__touchDbg = { count: ((window as any).__touchDbg?.count ?? 0) + 1, x: Math.round(cx), y: Math.round(cy), hit: 'confirm-' + (cx < LOGICAL_WIDTH / 2 ? 'oui' : 'non') };
                  confirmChoice(cx < LOGICAL_WIDTH / 2);
                  return;
                }
                const mid = LOGICAL_WIDTH / 2;
                for (const btn of PAUSE_BUTTONS) {
                  const bx = mid - 130;
                  if (cx >= bx && cx <= bx + 260 && cy >= btn.y && cy <= btn.y + btn.h) {
                    (window as any).__touchDbg = { count: ((window as any).__touchDbg?.count ?? 0) + 1, x: Math.round(cx), y: Math.round(cy), hit: btn.action };
                    switch (btn.action) {
                      case 'resume': stateRef.current.phase = stateRef.current.prevPhase; break;
                      case 'quit': stateRef.current.confirmDialog = { visible: true, message: 'Retourner au menu principal ?', action: 'quit' }; break;
                      case 'resetLevel': stateRef.current.confirmDialog = { visible: true, message: 'Recommencer le niveau ?', action: 'resetLevel' }; break;
                      case 'resetFull': stateRef.current.confirmDialog = { visible: true, message: 'Tout recommencer (vies aussi) ?', action: 'resetFull' }; break;
                      case 'options': stateRef.current.prevPhase = 'paused'; stateRef.current.phase = 'options'; break;
                    }
                    return;
                  }
                }
                (window as any).__touchDbg = { count: ((window as any).__touchDbg?.count ?? 0) + 1, x: Math.round(cx), y: Math.round(cy), hit: 'miss' };
              }
            }}
            onPointerUp={(e) => { e.preventDefault(); }}
            onPointerLeave={(e) => { e.preventDefault(); }}
            onPointerCancel={(e) => { e.preventDefault(); }}
          />
        )}

        {/* Surcouche options tactile — même principe que la pause : plein écran,
            indépendante du mode de contrôle (overlay/classic/tilt). Fermeture via
            les boutons de coin ⏸/ℹ (cf. useGame: input.pause/info ferment 'options'). */}
        {hasTouch && stateRef.current.phase === 'options' && (
          <div
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 15, touchAction: 'none', background: 'transparent' }}
            onPointerDown={(e) => {
              e.preventDefault();
              const rect = canvasRef.current?.getBoundingClientRect();
              if (!rect) return;
              const sx = LOGICAL_WIDTH / rect.width;
              const sy = LOGICAL_HEIGHT / rect.height;
              const cx = (e.clientX - rect.left) * sx;
              const cy = (e.clientY - rect.top) * sy;
              const mid = LOGICAL_WIDTH / 2;
              const rx = mid - OPTIONS_ROW_W / 2;
              const row = Math.floor((cy - (OPTIONS_ROWS_TOP - OPTIONS_ROW_SPACING / 2)) / OPTIONS_ROW_SPACING);
              if (cx < rx || cx > rx + OPTIONS_ROW_W || row < 0 || row >= OPTIONS_ROW_COUNT) return;
              const opts = optionsRef.current;
              switch (row) {
                case 0: updateOptions({ invertZones: !opts.invertZones }); break;
                case 1: {
                  const ratios = [0.3, 0.4, 0.5, 0.6, 0.7];
                  const ri = ratios.indexOf(opts.zoneSplitRatio);
                  updateOptions({ zoneSplitRatio: ratios[(ri + 1) % ratios.length] });
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
                  const sens = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
                  const si = sens.indexOf(opts.touchSensitivity);
                  updateOptions({ touchSensitivity: sens[(si + 1) % sens.length] });
                  break;
                }
                case 5: updateOptions({ chromeLess: !opts.chromeLess }); break;
              }
            }}
            onPointerUp={(e) => { e.preventDefault(); }}
            onPointerLeave={(e) => { e.preventDefault(); }}
            onPointerCancel={(e) => { e.preventDefault(); }}
          />
        )}

        {/* Boutons coin pause/info (tactile seulement) */}
        {hasTouch && (
          <div className="touch-corner-btns" style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20, pointerEvents: 'none' }}>
            <button className="touch-corner-btn" onPointerDown={handleTouchPause}
              style={{ position: 'absolute', top: 4, left: 4, width: 36, height: 36, borderRadius: 8, background: 'rgba(40,60,120,0.5)', border: '1px solid rgba(80,120,200,0.5)', color: '#aaccff', fontSize: 16, cursor: 'pointer', pointerEvents: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>⏸</button>
            <button className="touch-corner-btn" onPointerDown={handleTouchInfo}
              style={{ position: 'absolute', top: 4, right: 4, width: 36, height: 36, borderRadius: 8, background: 'rgba(40,60,120,0.5)', border: '1px solid rgba(80,120,200,0.5)', color: '#aaccff', fontSize: 16, cursor: 'pointer', pointerEvents: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>ℹ          </button>
          </div>
        )}

        {/* Orientation prompt portrait → paysage */}
        {hasTouch && <div className="orientation-prompt" style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          zIndex: 999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', gap: 20,
          background: 'rgba(3,4,15,0.92)',
        }}>
          <div style={{ fontSize: 60, animation: 'rotateHint 2s ease-in-out infinite' }}>↻</div>
          <div style={{ fontFamily: '"Courier New", monospace', color: '#88aaff', fontSize: 18, textAlign: 'center', whiteSpace: 'nowrap' }}>
            TOURNE TON APPAREIL<br/>EN MODE PAYSAGE
          </div>
        </div>}
      </div>

      {hasKeyboard && (
        <div
          style={{
            color: 'rgba(80,120,200,0.55)',
            fontSize: 12,
            fontFamily: '"Courier New", monospace',
            letterSpacing: 2,
            paddingBottom: 6,
            flexShrink: 0,
          }}
          className="keyboard-hint"
        >
          ← → DÉPLACER &nbsp;|&nbsp; ESPACE TIRER / CHARGER &nbsp;|&nbsp; I INFOS &nbsp;|&nbsp; O OPTIONS &nbsp;|&nbsp; M SILENCE &nbsp;|&nbsp; P PAUSE &nbsp;|&nbsp; ENTRÉE NIVEAUX &nbsp;|&nbsp; R RESET
        </div>
      )}

      <style>{`
        .touch-overlay { touch-action: none; }
        @media not (any-pointer: coarse) {
          .touch-overlay { display: none !important; }
          .touch-corner-btns { display: none !important; }
        }
        @media not (any-pointer: fine) {
          .keyboard-hint { display: none !important; }
        }
        .orientation-prompt { display: none !important; }
        @media (orientation: portrait) and (any-pointer: coarse) {
          .orientation-prompt { display: flex !important; }
        }
        @keyframes rotateHint {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(90deg); }
        }
        input[type="range"] { background: transparent; }
        input[type="range"]::-webkit-slider-runnable-track {
          height: 4px;
          background: rgba(80,120,200,0.3);
          border-radius: 2px;
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 12px;
          width: 12px;
          border-radius: 50%;
          background: #4488ff;
          margin-top: -4px;
        }
      `}</style>
    </div>
  );
}
