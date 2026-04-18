// ──────────────────────────────────────────────────────────────
// MCStatsBot — Daten-Typen und Hilfsfunktionen
// ──────────────────────────────────────────────────────────────

export interface OnlinePlayer {
  name: string;
  world: string;
  afk: boolean;
  sessionSeconds: number;
}

export interface PlayerOfDay {
  name: string;
  playtime: number;
}

export interface Overview {
  uniquePlayers: number;
  newPlayers: number;
  totalPlaytimeSeconds: number;
  chatMessages: number;
  playerOfDay?: PlayerOfDay;
  earlyBird?: { name: string; time: string };
  nightOwl?: { name: string; time: string };
}

export interface PlaytimeEntry {
  name: string;
  seconds: number;
}

export interface KillerEntry {
  name: string;
  kills: number;
}

export interface MobTypeEntry {
  type: string;
  count: number;
}

export interface PvPKill {
  killer: string;
  victim: string;
  weapon: string;
}

export interface Combat {
  totalMobKills: number;
  totalDeaths: number;
  topKillers: KillerEntry[];
  mobTypes: MobTypeEntry[];
  pvpKills: PvPKill[];
  funniestDeath?: { name: string; message: string };
  longestStreak?: { name: string; streak: number };
}

export interface Mining {
  totalBroken: number;
  totalPlaced: number;
  topMiners: { name: string; total: number }[];
  topBuilders: { name: string; total: number }[];
  rareBlocks: { name: string; block: string; count: number }[];
}

export interface Exploration {
  totalDistance: number;
  farthestWalker?: { name: string; distance: number };
  topExplorers: { name: string; chunks: number }[];
  netherPortals: number;
  endPortals: number;
}

export interface WeekDay {
  day: string;
  label: string;
  players: number;
}

export interface Weekly {
  totalPlayers: number;
  totalPlaytime: number;
  totalKills: number;
  totalDeaths: number;
  days: WeekDay[];
}

export interface GameEvent {
  emoji: string;
  text: string;
  time: string;
}

export interface StatsData {
  serverName: string;
  onlinePlayers: OnlinePlayer[];
  overview: Overview;
  playtimeRanking: PlaytimeEntry[];
  combat: Combat;
  mining: Mining;
  exploration: Exploration;
  weekly: Weekly;
  events: GameEvent[];
  funFacts: string[];
}

// ── Formatierung ──

export function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '0s';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function formatNumber(n: number): string {
  if (!n) return '0';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toString();
}

export function formatDistance(blocks: number): string {
  if (!blocks) return '0 Bloecke';
  const km = blocks / 1000;
  return km >= 1 ? km.toFixed(2) + ' km' : Math.round(blocks) + ' Bloecke';
}

export function skinUrl(name: string): string {
  return `https://mc-heads.net/avatar/${name}/36`;
}

// ── Demo-Daten ──

export function getDemoData(): StatsData {
  return {
    serverName: 'Minecraft Server',
    onlinePlayers: [
      { name: 'Jinagedon', world: 'overworld', afk: false, sessionSeconds: 7240 },
      { name: 'ThePomes', world: 'nether', afk: false, sessionSeconds: 3180 },
      { name: 'xFab1x_o', world: 'overworld', afk: true, sessionSeconds: 8400 },
      { name: 'Dxrkoy', world: 'end', afk: false, sessionSeconds: 1920 },
    ],
    overview: {
      uniquePlayers: 12,
      newPlayers: 2,
      totalPlaytimeSeconds: 86400,
      chatMessages: 342,
      playerOfDay: { name: 'Jinagedon', playtime: 14520 },
      earlyBird: { name: 'ThePomes', time: '06:32' },
      nightOwl: { name: 'xFab1x_o', time: '02:14' },
    },
    playtimeRanking: [
      { name: 'Jinagedon', seconds: 14520 },
      { name: 'xFab1x_o', seconds: 11340 },
      { name: 'ThePomes', seconds: 8700 },
      { name: 'Dxrkoy', seconds: 5400 },
      { name: 'panie18', seconds: 3200 },
    ],
    combat: {
      totalMobKills: 847,
      totalDeaths: 23,
      topKillers: [
        { name: 'Jinagedon', kills: 312 },
        { name: 'ThePomes', kills: 198 },
        { name: 'xFab1x_o', kills: 156 },
      ],
      mobTypes: [
        { type: 'Zombie', count: 234 },
        { type: 'Skeleton', count: 189 },
        { type: 'Creeper', count: 156 },
        { type: 'Spider', count: 98 },
        { type: 'Enderman', count: 67 },
      ],
      pvpKills: [
        { killer: 'Jinagedon', victim: 'Dxrkoy', weapon: 'Diamond Sword' },
        { killer: 'ThePomes', victim: 'panie18', weapon: 'Bow' },
      ],
      funniestDeath: { name: 'panie18', message: 'panie18 fell from a ladder' },
      longestStreak: { name: 'Jinagedon', streak: 47 },
    },
    mining: {
      totalBroken: 24500,
      totalPlaced: 18200,
      topMiners: [
        { name: 'xFab1x_o', total: 8402 },
        { name: 'Jinagedon', total: 6123 },
        { name: 'ThePomes', total: 4800 },
      ],
      topBuilders: [
        { name: 'ThePomes', total: 7200 },
        { name: 'Jinagedon', total: 5100 },
        { name: 'Dxrkoy', total: 3400 },
      ],
      rareBlocks: [
        { name: 'xFab1x_o', block: 'Diamond', count: 14 },
        { name: 'Jinagedon', block: 'Ancient Debris', count: 6 },
        { name: 'ThePomes', block: 'Emerald', count: 9 },
      ],
    },
    exploration: {
      totalDistance: 89200,
      farthestWalker: { name: 'Jinagedon', distance: 23400 },
      topExplorers: [
        { name: 'Jinagedon', chunks: 342 },
        { name: 'ThePomes', chunks: 198 },
        { name: 'Dxrkoy', chunks: 167 },
      ],
      netherPortals: 34,
      endPortals: 2,
    },
    weekly: {
      totalPlayers: 23,
      totalPlaytime: 266400,
      totalKills: 3200,
      totalDeaths: 41,
      days: [
        { day: 'Mo', players: 3, label: '03.03' },
        { day: 'Di', players: 5, label: '04.03' },
        { day: 'Mi', players: 6, label: '05.03' },
        { day: 'Do', players: 4, label: '06.03' },
        { day: 'Fr', players: 7, label: '07.03' },
        { day: 'Sa', players: 6, label: '08.03' },
        { day: 'So', players: 5, label: '09.03' },
      ],
    },
    events: [
      { emoji: '🏆', text: "Jinagedon hat 'Diamonds!' freigeschaltet", time: '14:32' },
      { emoji: '💀', text: 'panie18 fell from a high place', time: '15:10' },
      { emoji: '⚔️', text: 'Jinagedon hat Dxrkoy im PvP besiegt', time: '16:45' },
      { emoji: '💎', text: 'xFab1x_o hat 6 Diamanten gefunden', time: '17:22' },
      { emoji: '🐉', text: 'Server hat den Ender Dragon besiegt!', time: '19:05' },
    ],
    funFacts: [
      'Heute wurden genug Bloecke abgebaut, um eine 245 Block hohe Saeule zu bauen.',
      'Spieler haben heute 89 km zurueckgelegt — das entspricht Wien → St. Poelten.',
      'xFab1x_o hat 43 Schweine... beseitigt.',
    ],
  };
}
