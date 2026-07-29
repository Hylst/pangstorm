import { useRef, useCallback, useEffect, useState } from 'react';
import { useGame } from './game/useGame';
import { LOGICAL_WIDTH, LOGICAL_HEIGHT } from './game/constants';

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
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
    setIsDesktop(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const {
    toggleMute, muted,
    sfxVol, musicVol, handleSfxVol, handleMusicVol,
    handleTouchZone, handleTouchZoneEnd,
    optionsRef, toggleFullscreen,
    handleTouchPause, handleTouchInfo,
  } = useGame(canvasRef);

  const getZoneStyle = useCallback((side: 'left' | 'right'): React.CSSProperties => {
    const opts = optionsRef.current;
    const splitRatio = opts.classicMode ? 0.5 : (opts.invertZones ? 1 - opts.zoneSplitRatio : opts.zoneSplitRatio);
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

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
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

          {isDesktop && (
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
          )}
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

        {/* Zones tactiles — cachées en classicMode ou desktop */}
        {!isDesktop && !optionsRef.current.classicMode && (
          <div className="touch-overlay">
            <div
              style={getZoneStyle('left')}
              onPointerDown={(e) => handleTouchZone('fire', e)}
              onPointerUp={(e) => handleTouchZoneEnd('fire', e)}
              onPointerLeave={(e) => handleTouchZoneEnd('fire', e)}
              onPointerCancel={(e) => handleTouchZoneEnd('fire', e)}
            />
            <div
              style={getZoneStyle('right')}
              onPointerDown={(e) => handleTouchZone('move', e)}
              onPointerMove={(e) => handleTouchZone('move', e)}
              onPointerUp={(e) => handleTouchZoneEnd('move', e)}
              onPointerLeave={(e) => handleTouchZoneEnd('move', e)}
              onPointerCancel={(e) => handleTouchZoneEnd('move', e)}
            />
            {/* Indicateurs visuels */}
            <div style={{ position: 'absolute', bottom: 16, left: '25%', transform: 'translateX(-50%)', width: 64, height: 64, borderRadius: '50%', border: '2px solid rgba(255,100,100,0.4)', background: 'radial-gradient(circle, rgba(255,60,60,0.25), transparent 70%)', zIndex: 11, pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: 16, right: '25%', transform: 'translateX(50%)', width: 80, height: 80, borderRadius: '50%', border: '2px solid rgba(100,160,255,0.4)', background: 'radial-gradient(circle, rgba(60,120,255,0.25), transparent 70%)', zIndex: 11, pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: 56, right: '25%', transform: 'translateX(50%)', width: 16, height: 16, borderRadius: '50%', background: 'rgba(180,220,255,0.5)', zIndex: 11, pointerEvents: 'none' }} />
          </div>
        )}

        {/* Mode classique : boutons du bas */}
        {!isDesktop && optionsRef.current.classicMode && (
          <div style={{ position: 'absolute', bottom: 14, left: 0, right: 0, display: 'flex', justifyContent: 'space-between', padding: '0 20px', zIndex: 11 }}>
            <button style={btnStyle} onPointerDown={(e) => { e.preventDefault(); handleTouchZone('move', e); }} onPointerUp={(e) => handleTouchZoneEnd('move', e)} onPointerLeave={(e) => handleTouchZoneEnd('move', e)}>◀</button>
            <button style={{ ...btnStyle, width: 112, height: 112, fontSize: 24 }} onPointerDown={(e) => { e.preventDefault(); handleTouchZone('fire', e); }} onPointerLeave={(e) => handleTouchZoneEnd('fire', e)} onPointerUp={(e) => handleTouchZoneEnd('fire', e)}>🔥</button>
            <button style={btnStyle} onPointerDown={(e) => { e.preventDefault(); handleTouchZone('move', e); }} onPointerUp={(e) => handleTouchZoneEnd('move', e)} onPointerLeave={(e) => handleTouchZoneEnd('move', e)}>▶</button>
          </div>
        )}

        {/* Boutons coin pause/info (tactile seulement) */}
        <div className="touch-corner-btns" style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20, pointerEvents: 'none' }}>
          <button className="touch-corner-btn" onPointerDown={handleTouchPause}
            style={{ position: 'absolute', top: 4, left: 4, width: 36, height: 36, borderRadius: 8, background: 'rgba(40,60,120,0.5)', border: '1px solid rgba(80,120,200,0.5)', color: '#aaccff', fontSize: 16, cursor: 'pointer', pointerEvents: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>⏸</button>
          <button className="touch-corner-btn" onPointerDown={handleTouchInfo}
            style={{ position: 'absolute', top: 4, right: 4, width: 36, height: 36, borderRadius: 8, background: 'rgba(40,60,120,0.5)', border: '1px solid rgba(80,120,200,0.5)', color: '#aaccff', fontSize: 16, cursor: 'pointer', pointerEvents: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>ℹ</button>
        </div>
      </div>

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

      <style>{`
        @media (hover: hover) and (pointer: fine) {
          .touch-controls { display: none !important; }
          .touch-overlay { display: none !important; }
          .touch-corner-btns { display: none !important; }
        }
        @media (hover: none) or (pointer: coarse) {
          .keyboard-hint { display: none !important; }
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
