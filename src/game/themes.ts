export interface LevelTheme {
  name: string;
  bgIndex: number;
  ballColors: [string, string, string];
  fallbackTop: string;
  fallbackBottom: string;
  accent: string;
  floorGlow: string;
  hudColor: string;
  description: string;
}

const PA: [string, string, string] = ['#ff3a6e', '#00e5ff', '#ffdd00'];
const PB: [string, string, string] = ['#ff6b00', '#ffdd00', '#ff3a6e'];
const PC: [string, string, string] = ['#39ff14', '#00e5ff', '#a259ff'];
const PD: [string, string, string] = ['#00e5ff', '#a259ff', '#ffffff'];
const PE: [string, string, string] = ['#ff3a6e', '#ffdd00', '#39ff14'];
const PF: [string, string, string] = ['#ffdd00', '#ff3a6e', '#00e5ff'];
const PG: [string, string, string] = ['#a259ff', '#ff3a6e', '#00e5ff'];
const PH: [string, string, string] = ['#ff6b00', '#39ff14', '#00e5ff'];

// chaque bloc = 6 niveaux ; un bloc bitmap partage le même bgIndex
// mais chaque entrée a ses propres couleurs, nom, description

const THEMES: LevelTheme[] = [

  // ─── Bloc 0 : niveaux 1-6, fond gradient pur ───
  { name: 'LES PRÉMICES',      bgIndex: -1, ballColors: PA, fallbackTop: '#03040f', fallbackBottom: '#0a0e2a', accent: 'rgba(80,160,255,0.40)', floorGlow: '#4488ff',   hudColor: '#c0d8ff', description: 'Apprends à viser, les bases.' },
  { name: 'PREMIERS PAS',      bgIndex: -1, ballColors: PB, fallbackTop: '#0f0503', fallbackBottom: '#1c0a08', accent: 'rgba(255,100,40,0.45)', floorGlow: '#ff6600',   hudColor: '#ffd0c0', description: 'Ça chauffe, garde ton calme.' },
  { name: 'MONTÉE EN RYTHME',  bgIndex: -1, ballColors: PC, fallbackTop: '#030f07', fallbackBottom: '#081c0e', accent: 'rgba(40,255,100,0.45)', floorGlow: '#39ff14',   hudColor: '#c0ffd8', description: 'Le jeu s\'anime, trouve ton flow.' },
  { name: 'RÉVEIL DES SENS',   bgIndex: -1, ballColors: PD, fallbackTop: '#020a12', fallbackBottom: '#051420', accent: 'rgba(0,200,255,0.45)', floorGlow: '#00ccff',   hudColor: '#c0e8ff', description: 'Les couleurs s\'intensifient.' },
  { name: 'CONCENTRATION',     bgIndex: -1, ballColors: PA, fallbackTop: '#0a0310', fallbackBottom: '#150818', accent: 'rgba(200,80,255,0.45)', floorGlow: '#cc66ff',   hudColor: '#e8c0ff', description: 'Reste focus, chaque tir compte.' },
  { name: 'ZÉNITH',            bgIndex: -1, ballColors: PE, fallbackTop: '#01030a', fallbackBottom: '#04081a', accent: 'rgba(255,200,0,0.45)', floorGlow: '#ffcc00',   hudColor: '#ffe8c0', description: 'Le sommet de l\'échauffement.' },

  // ─── Bloc 1 : niveaux 7-12, bgIndex 0 (Cité Néon) ───
  { name: 'CITÉ NÉON — L\'Aube',        bgIndex: 0, ballColors: PA, fallbackTop: '#03040f', fallbackBottom: '#080c22', accent: 'rgba(80,160,255,0.40)', floorGlow: '#4488ff',   hudColor: '#c0d8ff', description: 'Les néons s\'éteignent doucement.' },
  { name: 'CITÉ NÉON — Le Midi',        bgIndex: 0, ballColors: PB, fallbackTop: '#03040f', fallbackBottom: '#080c22', accent: 'rgba(255,100,40,0.45)', floorGlow: '#ff6600',   hudColor: '#ffd0c0', description: 'La ville vibre en pleine lumière.' },
  { name: 'CITÉ NÉON — Le Crépuscule',  bgIndex: 0, ballColors: PC, fallbackTop: '#03040f', fallbackBottom: '#080c22', accent: 'rgba(40,255,100,0.50)', floorGlow: '#39ff14',   hudColor: '#c0ffd8', description: 'Les ombres s\'allongent sur les vitres.' },
  { name: 'CITÉ NÉON — La Nuit',        bgIndex: 0, ballColors: PD, fallbackTop: '#03040f', fallbackBottom: '#080c22', accent: 'rgba(0,200,255,0.55)', floorGlow: '#00ccff',   hudColor: '#c0e8ff', description: 'Les enseignes clignotent dans le noir.' },
  { name: 'CITÉ NÉON — L\'Orage',       bgIndex: 0, ballColors: PE, fallbackTop: '#03040f', fallbackBottom: '#080c22', accent: 'rgba(200,80,255,0.55)', floorGlow: '#cc66ff',   hudColor: '#e8c0ff', description: 'La pluie frappe les pavés humides.' },
  { name: 'CITÉ NÉON — La Fête',        bgIndex: 0, ballColors: PF, fallbackTop: '#03040f', fallbackBottom: '#080c22', accent: 'rgba(255,200,0,0.60)', floorGlow: '#ffcc00',   hudColor: '#ffe8c0', description: 'Les lasers percent la brume.' },

  // ─── Bloc 2 : niveaux 13-18, bgIndex 1 (Magma) ───
  { name: 'CŒUR DE MAGMA — Les Entrailles', bgIndex: 1, ballColors: PB, fallbackTop: '#0f0303', fallbackBottom: '#1c0808', accent: 'rgba(255,100,40,0.40)', floorGlow: '#ff6600',   hudColor: '#ffd0c0', description: 'La roche fond sous la pression.' },
  { name: 'CŒUR DE MAGMA — La Fournaise',   bgIndex: 1, ballColors: PA, fallbackTop: '#0f0303', fallbackBottom: '#1c0808', accent: 'rgba(80,160,255,0.45)', floorGlow: '#4488ff',   hudColor: '#c0d8ff', description: 'Les flammes dansent sans répit.' },
  { name: 'CŒUR DE MAGMA — Le Cratère',     bgIndex: 1, ballColors: PE, fallbackTop: '#0f0303', fallbackBottom: '#1c0808', accent: 'rgba(40,255,100,0.50)', floorGlow: '#39ff14',   hudColor: '#c0ffd8', description: 'Le bord du monde est incandescent.' },
  { name: 'CŒUR DE MAGMA — La Coulée',     bgIndex: 1, ballColors: PG, fallbackTop: '#0f0303', fallbackBottom: '#1c0808', accent: 'rgba(0,200,255,0.55)', floorGlow: '#00ccff',   hudColor: '#c0e8ff', description: 'Une rivière de feu serpente.' },
  { name: 'CŒUR DE MAGMA — Les Braises',   bgIndex: 1, ballColors: PH, fallbackTop: '#0f0303', fallbackBottom: '#1c0808', accent: 'rgba(200,80,255,0.55)', floorGlow: '#cc66ff',   hudColor: '#e8c0ff', description: 'La cendre retombe lentement.' },
  { name: 'CŒUR DE MAGMA — Le Tréfonds',   bgIndex: 1, ballColors: PB, fallbackTop: '#0f0303', fallbackBottom: '#1c0808', accent: 'rgba(255,200,0,0.60)', floorGlow: '#ffcc00',   hudColor: '#ffe8c0', description: 'Le cœur de la terre rugit.' },

  // ─── Bloc 3 : niveaux 19-24, bgIndex 2 (Jungle) ───
  { name: 'JUNGLE LUEUR — La Canopée',     bgIndex: 2, ballColors: PC, fallbackTop: '#030f07', fallbackBottom: '#081c0e', accent: 'rgba(40,255,100,0.40)', floorGlow: '#39ff14',   hudColor: '#c0ffd8', description: 'La lumière filtre à travers les feuilles.' },
  { name: 'JUNGLE LUEUR — Le Sol Humide',  bgIndex: 2, ballColors: PH, fallbackTop: '#030f07', fallbackBottom: '#081c0e', accent: 'rgba(80,160,255,0.45)', floorGlow: '#4488ff',   hudColor: '#c0d8ff', description: 'Des lucioles dansent sous les frondes.' },
  { name: 'JUNGLE LUEUR — La Clairière',   bgIndex: 2, ballColors: PA, fallbackTop: '#030f07', fallbackBottom: '#081c0e', accent: 'rgba(255,100,40,0.50)', floorGlow: '#ff6600',   hudColor: '#ffd0c0', description: 'Un rayon perce la verdure dense.' },
  { name: 'JUNGLE LUEUR — Les Lianes',     bgIndex: 2, ballColors: PG, fallbackTop: '#030f07', fallbackBottom: '#081c0e', accent: 'rgba(0,200,255,0.55)', floorGlow: '#00ccff',   hudColor: '#c0e8ff', description: 'Les plantes bougent, la vie grouille.' },
  { name: 'JUNGLE LUEUR — Le Marais',      bgIndex: 2, ballColors: PD, fallbackTop: '#030f07', fallbackBottom: '#081c0e', accent: 'rgba(200,80,255,0.55)', floorGlow: '#cc66ff',   hudColor: '#e8c0ff', description: 'L\'eau stagnante luit faiblement.' },
  { name: 'JUNGLE LUEUR — Le Crépuscule Vert', bgIndex: 2, ballColors: PC, fallbackTop: '#030f07', fallbackBottom: '#081c0e', accent: 'rgba(255,200,0,0.60)', floorGlow: '#ffcc00', hudColor: '#ffe8c0', description: 'La jungle retient son souffle.' },

  // ─── Bloc 4 : niveaux 25-30, bgIndex 3 (Cristal) ───
  { name: 'CAVERNES DE CRISTAL — La Grotte',      bgIndex: 3, ballColors: PD, fallbackTop: '#020a12', fallbackBottom: '#051420', accent: 'rgba(0,200,255,0.40)', floorGlow: '#00ccff',   hudColor: '#c0e8ff', description: 'La roche scintille faiblement.' },
  { name: 'CAVERNES DE CRISTAL — Le Puit',        bgIndex: 3, ballColors: PG, fallbackTop: '#020a12', fallbackBottom: '#051420', accent: 'rgba(200,80,255,0.45)', floorGlow: '#cc66ff',   hudColor: '#e8c0ff', description: 'Une lumière bleue monte des profondeurs.' },
  { name: 'CAVERNES DE CRISTAL — La Salle des Échos', bgIndex: 3, ballColors: PE, fallbackTop: '#020a12', fallbackBottom: '#051420', accent: 'rgba(40,255,100,0.50)', floorGlow: '#39ff14',   hudColor: '#c0ffd8', description: 'Chaque son rebondit à l\'infini.' },
  { name: 'CAVERNES DE CRISTAL — Les Stalactites', bgIndex: 3, ballColors: PF, fallbackTop: '#020a12', fallbackBottom: '#051420', accent: 'rgba(255,100,40,0.55)', floorGlow: '#ff6600',   hudColor: '#ffd0c0', description: 'Des pointes de cristal pendent au plafond.' },
  { name: 'CAVERNES DE CRISTAL — Le Lac Gelé',    bgIndex: 3, ballColors: PA, fallbackTop: '#020a12', fallbackBottom: '#051420', accent: 'rgba(80,160,255,0.55)', floorGlow: '#4488ff',   hudColor: '#c0d8ff', description: 'La surface gelée reflète l\'au-delà.' },
  { name: 'CAVERNES DE CRISTAL — Le Dôme',        bgIndex: 3, ballColors: PD, fallbackTop: '#020a12', fallbackBottom: '#051420', accent: 'rgba(255,200,0,0.60)', floorGlow: '#ffcc00',   hudColor: '#ffe8c0', description: 'Les parois vibrent d\'une énergie ancienne.' },

  // ─── Bloc 5 : niveaux 31-36, bgIndex 4 (Nébuleuse) ───
  { name: 'NÉBULEUSE DU VIDE — Le Vortex',       bgIndex: 4, ballColors: PE, fallbackTop: '#0a0310', fallbackBottom: '#150818', accent: 'rgba(255,100,40,0.40)', floorGlow: '#ff6600',   hudColor: '#ffd0c0', description: 'Un tourbillon d\'étoiles t\'aspire.' },
  { name: 'NÉBULEUSE DU VIDE — La Constellation', bgIndex: 4, ballColors: PA, fallbackTop: '#0a0310', fallbackBottom: '#150818', accent: 'rgba(80,160,255,0.45)', floorGlow: '#4488ff',   hudColor: '#c0d8ff', description: 'Les astres s\'alignent contre toi.' },
  { name: 'NÉBULEUSE DU VIDE — Le Trou Noir',    bgIndex: 4, ballColors: PC, fallbackTop: '#0a0310', fallbackBottom: '#150818', accent: 'rgba(40,255,100,0.50)', floorGlow: '#39ff14',   hudColor: '#c0ffd8', description: 'Rien n\'échappe à son attraction.' },
  { name: 'NÉBULEUSE DU VIDE — La Supernova',    bgIndex: 4, ballColors: PG, fallbackTop: '#0a0310', fallbackBottom: '#150818', accent: 'rgba(0,200,255,0.55)', floorGlow: '#00ccff',   hudColor: '#c0e8ff', description: 'Une lumière aveuglante emplit tout.' },
  { name: 'NÉBULEUSE DU VIDE — La Dérive',       bgIndex: 4, ballColors: PF, fallbackTop: '#0a0310', fallbackBottom: '#150818', accent: 'rgba(200,80,255,0.55)', floorGlow: '#cc66ff',   hudColor: '#e8c0ff', description: 'Les débris cosmiques flottent au loin.' },
  { name: 'NÉBULEUSE DU VIDE — Le Big Bang',     bgIndex: 4, ballColors: PH, fallbackTop: '#0a0310', fallbackBottom: '#150818', accent: 'rgba(255,200,0,0.60)', floorGlow: '#ffcc00',   hudColor: '#ffe8c0', description: 'Tout a commencé ici.' },
];

export function getTheme(level: number): LevelTheme {
  return THEMES[(level - 1) % THEMES.length];
}

export const MAX_UNIQUE_LEVELS = THEMES.length;
