import { useRef } from 'react';
import { useGame } from './game/useGame';
import { LOGICAL_WIDTH, LOGICAL_HEIGHT } from './game/constants';

// ─── On-screen button ────────────────────────────────────────────────────────
interface TouchBtnProps {
  label: string;
  onDown?: () => void;
  onUp?: () => void;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
}
function TouchBtn({ label, onDown, onUp, onClick, className = '', style = {} }: TouchBtnProps) {
  return (
    <button
      className={`select-none touch-none flex items-center justify-center
        rounded-full font-bold text-white text-opacity-90
        active:scale-95 transition-transform ${className}`}
      style={{
        background: 'rgba(80,120,255,0.22)',
        border: '2px solid rgba(100,160,255,0.45)',
        boxShadow: '0 0 18px rgba(80,120,255,0.3)',
        fontSize: 24,
        userSelect: 'none',
        ...style,
      }}
      onPointerDown={(e) => { e.preventDefault(); onDown?.(); }}
      onPointerUp={(e)   => { e.preventDefault(); onUp?.(); onClick?.(); }}
      onPointerLeave={(e)=> { e.preventDefault(); onUp?.(); }}
    >
      {label}
    </button>
  );
}

// ─── App ─────────────────────────────────────────────────────────────────────
export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { handleTouchLeft, handleTouchRight, handleTouchFire, handleTouchFireUp, toggleMute, muted } = useGame(canvasRef);

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
      {/* Top bar with mute + title */}
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
          {muted ? '🔇 SON OFF' : '🔊 SON'}
        </button>
      </div>

      {/* Game canvas container */}
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
      </div>

      {/* Mobile controls */}
      <div
        style={{
          width: '100%',
          maxWidth: LOGICAL_WIDTH,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '10px 20px 14px',
          gap: 12,
          flexShrink: 0,
        }}
        className="touch-controls"
      >
        <TouchBtn
          label="◀"
          onDown={() => handleTouchLeft(true)}
          onUp={() => handleTouchLeft(false)}
          className="w-24 h-24"
        />

        <TouchBtn
          label="🔥"
          onDown={() => handleTouchFire()}
          onUp={() => handleTouchFireUp()}
          className="w-28 h-28"
        />

        <TouchBtn
          label="▶"
          onDown={() => handleTouchRight(true)}
          onUp={() => handleTouchRight(false)}
          className="w-24 h-24"
        />
      </div>

      {/* Keyboard hint (desktop only) */}
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
        ← → DÉPLACER &nbsp;|&nbsp; ESPACE / CLIC TIRER &nbsp;|&nbsp; M SILENCE
      </div>

      <style>{`
        @media (hover: hover) and (pointer: fine) {
          .touch-controls { display: none !important; }
        }
        @media (hover: none) or (pointer: coarse) {
          .keyboard-hint { display: none !important; }
        }
      `}</style>
    </div>
  );
}
