// ─── Visual themes per level ────────────────────────────────────────────────

export interface LevelTheme {
  name: string;
  bgIndex: number;
  /** CSS hex colors for balls per tier: [large, medium, small] */
  ballColors: [string, string, string];
  /** Gradient fallback if image not loaded */
  fallbackTop: string;
  fallbackBottom: string;
  /** Grid/neon color */
  accent: string;
  /** Floor/ceiling glow color */
  floorGlow: string;
  /** Particle style */
  particleBlend: string;
  /** HUD color */
  hudColor: string;
  /** Description for onboarding/level intro */
  description: string;
}

export const LEVEL_THEMES: LevelTheme[] = [
  {
    name: 'CITÉ NÉON',
    bgIndex: 0,
    ballColors: ['#ff3a6e', '#00e5ff', '#ffdd00'],
    fallbackTop: '#03040f',
    fallbackBottom: '#080c22',
    accent: 'rgba(80,160,255,0.55)',
    floorGlow: '#4488ff',
    particleBlend: '#ffffff',
    hudColor: '#c0d8ff',
    description: 'Bienvenue dans les rues néon. Fais éclater les orbes !',
  },
  {
    name: 'CŒUR DE MAGMA',
    bgIndex: 1,
    ballColors: ['#ff6b00', '#ffdd00', '#ff3a6e'],
    fallbackTop: '#0f0303',
    fallbackBottom: '#1c0808',
    accent: 'rgba(255,100,40,0.55)',
    floorGlow: '#ff4400',
    particleBlend: '#ffaa00',
    hudColor: '#ffd0c0',
    description: 'La chaleur monte. Attention aux orbes plus rapides !',
  },
  {
    name: 'JUNGLE LUEUR',
    bgIndex: 2,
    ballColors: ['#39ff14', '#00e5ff', '#a259ff'],
    fallbackTop: '#030f07',
    fallbackBottom: '#081c0e',
    accent: 'rgba(40,255,100,0.50)',
    floorGlow: '#39ff14',
    particleBlend: '#88ffaa',
    hudColor: '#c0ffd8',
    description: 'La jungle grouille dune vie hostile et lumineuse.',
  },
  {
    name: 'CAVERNES DE CRISTAL',
    bgIndex: 3,
    ballColors: ['#00e5ff', '#a259ff', '#ffffff'],
    fallbackTop: '#020a12',
    fallbackBottom: '#051420',
    accent: 'rgba(0,200,255,0.50)',
    floorGlow: '#00ccff',
    particleBlend: '#aaddff',
    hudColor: '#c0e8ff',
    description: 'Des éclats gelés tombent. La précision est clé.',
  },
  {
    name: 'NÉBULEUSE DU VIDE',
    bgIndex: 4,
    ballColors: ['#ff3a6e', '#ffdd00', '#00e5ff'],
    fallbackTop: '#0a0310',
    fallbackBottom: '#150818',
    accent: 'rgba(200,80,255,0.55)',
    floorGlow: '#cc66ff',
    particleBlend: '#ffccff',
    hudColor: '#e8c0ff',
    description: 'La frontière finale. Survis au chaos cosmique !',
  },
];

export function getTheme(level: number): LevelTheme {
  return LEVEL_THEMES[(level - 1) % LEVEL_THEMES.length];
}
