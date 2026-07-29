export interface LevelTheme {
  name: string;
  bgIndex: number;       // -1 = pas de bg bitmap
  ballColors: [string, string, string];
  fallbackTop: string;
  fallbackBottom: string;
  accent: string;
  floorGlow: string;
  hudColor: string;
  description: string;
}

export const LEVEL_THEMES: LevelTheme[] = [
  // ── Niveaux 1-3 : pas de bg bitmap, pur gradient ──
  {
    name: 'LES PRÉMICES',
    bgIndex: -1,
    ballColors: ['#ff3a6e', '#00e5ff', '#ffdd00'],
    fallbackTop: '#03040f',
    fallbackBottom: '#0a0e2a',
    accent: 'rgba(80,160,255,0.40)',
    floorGlow: '#4488ff',
    hudColor: '#c0d8ff',
    description: 'Les fondamentales. Apprends à viser.',
  },
  {
    name: 'PREMIERS PAS',
    bgIndex: -1,
    ballColors: ['#ff6b00', '#ffdd00', '#ff3a6e'],
    fallbackTop: '#0f0503',
    fallbackBottom: '#1c0a08',
    accent: 'rgba(255,100,40,0.45)',
    floorGlow: '#ff6600',
    hudColor: '#ffd0c0',
    description: 'Ça chauffe doucement. Garde ton calme.',
  },
  {
    name: 'MONTÉE EN RYTHME',
    bgIndex: -1,
    ballColors: ['#39ff14', '#00e5ff', '#a259ff'],
    fallbackTop: '#030f07',
    fallbackBottom: '#081c0e',
    accent: 'rgba(40,255,100,0.45)',
    floorGlow: '#39ff14',
    hudColor: '#c0ffd8',
    description: 'Le jeu s\'anime. Trouve ton rythme.',
  },
  // ── Niveaux 4-5 : premier bg ──
  {
    name: 'CITÉ NÉON',
    bgIndex: 0,
    ballColors: ['#ff3a6e', '#00e5ff', '#ffdd00'],
    fallbackTop: '#03040f',
    fallbackBottom: '#080c22',
    accent: 'rgba(80,160,255,0.55)',
    floorGlow: '#4488ff',
    hudColor: '#c0d8ff',
    description: 'Bienvenue dans les rues néon.',
  },
  {
    name: 'CŒUR DE MAGMA',
    bgIndex: 1,
    ballColors: ['#ff6b00', '#ffdd00', '#ff3a6e'],
    fallbackTop: '#0f0303',
    fallbackBottom: '#1c0808',
    accent: 'rgba(255,100,40,0.55)',
    floorGlow: '#ff4400',
    hudColor: '#ffd0c0',
    description: 'La chaleur monte. Reste concentré.',
  },
  // ── Niveaux 6-7 ──
  {
    name: 'JUNGLE LUEUR',
    bgIndex: 2,
    ballColors: ['#39ff14', '#00e5ff', '#a259ff'],
    fallbackTop: '#030f07',
    fallbackBottom: '#081c0e',
    accent: 'rgba(40,255,100,0.50)',
    floorGlow: '#39ff14',
    hudColor: '#c0ffd8',
    description: 'La jungle grouille de vie lumineuse.',
  },
  {
    name: 'CAVERNES DE CRISTAL',
    bgIndex: 3,
    ballColors: ['#00e5ff', '#a259ff', '#ffffff'],
    fallbackTop: '#020a12',
    fallbackBottom: '#051420',
    accent: 'rgba(0,200,255,0.50)',
    floorGlow: '#00ccff',
    hudColor: '#c0e8ff',
    description: 'Éclats gelés. La précision paye.',
  },
  // ── Niveaux 8-9 ──
  {
    name: 'NÉBULEUSE DU VIDE',
    bgIndex: 4,
    ballColors: ['#ff3a6e', '#ffdd00', '#00e5ff'],
    fallbackTop: '#0a0310',
    fallbackBottom: '#150818',
    accent: 'rgba(200,80,255,0.55)',
    floorGlow: '#cc66ff',
    hudColor: '#e8c0ff',
    description: 'Le cosmos. Ne cligne pas des yeux.',
  },
  {
    name: 'ABYSSE NUMÉRIQUE',
    bgIndex: 0,
    ballColors: ['#00e5ff', '#ff3a6e', '#39ff14'],
    fallbackTop: '#01030a',
    fallbackBottom: '#04081a',
    accent: 'rgba(0,200,255,0.60)',
    floorGlow: '#22ddff',
    hudColor: '#c0eeff',
    description: 'Tout s\'accélère. Bonne chance.',
  },
  // ── Niveau 10+ : boucle ──
  {
    name: 'CITÉ NÉON II',
    bgIndex: 1,
    ballColors: ['#ffdd00', '#ff3a6e', '#00e5ff'],
    fallbackTop: '#03040f',
    fallbackBottom: '#080c22',
    accent: 'rgba(255,200,0,0.55)',
    floorGlow: '#ffcc00',
    hudColor: '#ffe8c0',
    description: 'Le cycle recommence, mais plus vite.',
  },
];

const NO_BG_COUNT = 3; // 3 premiers niveaux sans bitmap

export function getTheme(level: number): LevelTheme {
  if (level <= NO_BG_COUNT) return LEVEL_THEMES[level - 1];
  // niveaux 4-10 uniques, puis 11+ boucle sur 4-10
  const pool = LEVEL_THEMES.slice(NO_BG_COUNT);
  const idx = (level - 1 - NO_BG_COUNT) % pool.length;
  return pool[idx];
}

export const MAX_UNIQUE_LEVELS = LEVEL_THEMES.length;
