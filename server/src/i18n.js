// MCStatsBot Internationalization (i18n)
// Supported languages: de (German), en (English)

const translations = {
  de: {
    bot: {
      loggedIn: 'Eingeloggt als {tag}',
      commandsRegistered: 'Slash-Commands registriert',
      commandError: 'Fehler beim Registrieren der Commands',
      reportSent: 'Report gesendet für {server} in #{channel}',
      rateLimited: 'Rate limit: {server} hat 5 Reports/Stunde erreicht',
      securityError: 'SICHERHEIT: Channel {channel} gehört nicht zu Guild {guild}',
    },
    commands: {
      noServer: 'Kein Minecraft-Server mit diesem Discord-Server verknüpft.',
      noStats: 'Noch keine Statistiken vorhanden. Warte bis der Minecraft-Server Daten sendet.',
      noOnlineData: 'Keine Online-Daten verfügbar.',
      nobodyOnline: 'Aktuell ist niemand online.',
      playerNotFound: 'Spieler "{player}" nicht gefunden.',
      noPlayerStats: 'Keine Statistiken für diesen Spieler vorhanden.',
    },
    commandDesc: {
      stats: 'Zeigt aktuelle Server-Statistiken',
      online: 'Zeigt online Spieler',
      playerstats: 'Zeigt Statistiken für einen Spieler',
      playerOption: 'Name des Spielers',
    },
    report: {
      title: '📊 Täglicher Server-Report — {server}',
      players: '👥 Spieler heute',
      playersValue: '{active} aktiv, {new} neu',
      playtime: '⏱️ Gesamte Spielzeit',
      chat: '💬 Chat-Nachrichten',
      chatValue: '{count}',
      playerOfDay: '🏆 Spieler des Tages',
      noData: 'Noch keine Aktivität für heute.',
      footer: 'MCStatsBot • Täglicher Report',
    },
    playtime: {
      title: '⏱️ Spielzeit-Ranking',
      top10: '🏅 Top 10 Spielzeit',
      earlyBird: '🌅 Frühaufsteher',
      nightOwl: '🦉 Nachteule',
      longestSession: '🎮 Längste Session',
      average: '📊 Durchschnittliche Spielzeit',
    },
    combat: {
      title: '⚔️ Kampf-Statistiken',
      mobKills: '⚔️ Mob-Kills gesamt',
      deaths: '💀 Tode gesamt',
      topHunters: '🏹 Top Mob-Killer',
      mostDeaths: '💀 Meiste Tode',
      deathsCount: '{count} Tode',
      longestStreak: '💪 Längster Kill-Streak',
      streakValue: '{count} Kills',
      pvpOverview: '🗡️ PvP Übersicht',
      mobTypes: '🎯 Top Mob-Typen',
      deathStats: '📊 Todes-Statistik',
      cause: {
        mob: '⚔️ Mob/Spieler',
        fall: '🪂 Fall',
        lava: '🔥 Lava',
        drown: '💧 Ertrunken',
        fire: '🔥 Feuer',
        starve: '🍖 Verhungert',
        suffocation: '😮‍💨 Erstickt',
        other: '❓ Sonstiges',
      },
    },
    mining: {
      title: '⛏️ Mining & Building',
      broken: '⛏️ Blöcke abgebaut',
      placed: '🏗️ Blöcke platziert',
      rareFinds: '💎 Seltene Funde',
      topMiners: '🏅 Top Miner',
      topBuilders: '🧱 Top Builder',
      topCrafters: '🔨 Top Crafter',
      blocks: 'Blöcke',
      items: 'Items',
    },
    exploration: {
      title: '🗺️ Erkundung & Bewegung',
      totalDistance: '🚶 Gesamte Distanz',
      netherPortals: '🌀 Nether-Reisen',
      endPortals: '🌌 End-Reisen',
      farthestWalker: '🏃 Weiteste Strecke',
      topExplorers: '🗺️ Entdecker-Award',
      chunks: 'neue Chunks',
    },
    achievements: {
      title: '🏆 Achievements & Fortschritt',
      today: '🏆 Achievements heute ({count})',
      mostXp: '⭐ Meiste XP gesammelt',
    },
    funFacts: {
      title: '🎉 Fun Facts & Sonstiges',
      blocksBroken: 'Heute wurden {count} Blöcke abgebaut.',
      blocksPillar: 'Heute wurden {count} Blöcke abgebaut — das reicht für eine {height} Block hohe Säule.',
      distance: 'Spieler haben heute {km} km zurückgelegt.',
      distanceCircle: 'Heute wurden {km} km zurückgelegt — etwa {percent}% eines Marathons.',
      mobKills: 'Heute wurden {count} Mobs zur Strecke gebracht. RIP.',
      chatMessages: '{count} Chat-Nachrichten flogen durch den Server.',
      foodAward: '🍖 Vielfraß-Award: **{name}** — {count}x Essen',
      potions: '🧪 {count} Tränke getrunken',
      sleepAward: '💤 Schlafmütze-Award: **{name}** — {count}x geschlafen',
      topTrader: '📦 Top Händler: **{name}** — {count} Trades',
      noActivity: 'Noch keine Statistiken für heute — spring auf den Server und leg los!',
    },
    records: {
      title: '📊 Rekorde & Vergleich',
      comparison: '📊 Vergleich zu gestern',
      playersLabel: '👥 Spieler',
      playtimeLabel: '⏱️ Spielzeit',
      same: 'gleich',
      weekTrend: '📈 Spieler-Trend (7 Tage)',
      alltimePlaytime: '🥇 Allzeit: Spielzeit',
      alltimeMobKills: '🥇 Allzeit: Mob-Kills',
      alltimeDeaths: '🥇 Allzeit: Tode',
      alltimeMining: '🥇 Allzeit: Mining',
      nextReport: 'MCStatsBot • Nächster Report morgen',
    },
    events: {
      title: '📰 Aktuelle Ereignisse',
      advancement: '{player} hat "{advancement}" freigeschaltet',
      death: '{player} ist gestorben',
      deathMessage: '{message}',
      pvpKill: '{killer} hat {victim} im PvP besiegt',
    },
    online: {
      title: '🟢 Online Spieler ({count})',
      afk: 'AFK',
    },
    playerStats: {
      title: '📊 Spielerstatistiken — {player}',
      playtime: '⏱️ Spielzeit',
      mobKills: '🗡️ Mob-Kills',
      deaths: '💀 Tode',
      blocksBroken: '⛏️ Abgebaut',
      blocksPlaced: '🧱 Platziert',
      distance: '🗺️ Gelaufen',
      jumps: '🦘 Sprünge',
      chatMessages: '💬 Nachrichten',
      lastSeen: '👁️ Zuletzt gesehen',
      firstJoin: '📅 Erster Beitritt',
    },
  },

  en: {
    bot: {
      loggedIn: 'Logged in as {tag}',
      commandsRegistered: 'Slash commands registered',
      commandError: 'Error registering commands',
      reportSent: 'Report sent for {server} in #{channel}',
      rateLimited: 'Rate limit: {server} reached 5 reports/hour',
      securityError: 'SECURITY: Channel {channel} does not belong to Guild {guild}',
    },
    commands: {
      noServer: 'No Minecraft server linked to this Discord server.',
      noStats: 'No statistics available yet. Wait until the Minecraft server sends data.',
      noOnlineData: 'No online data available.',
      nobodyOnline: 'Nobody is currently online.',
      playerNotFound: 'Player "{player}" not found.',
      noPlayerStats: 'No statistics available for this player.',
    },
    commandDesc: {
      stats: 'Shows current server statistics',
      online: 'Shows online players',
      playerstats: 'Shows statistics for a player',
      playerOption: 'Name of the player',
    },
    report: {
      title: '📊 Daily Server Report — {server}',
      players: '👥 Players Today',
      playersValue: '{active} active, {new} new',
      playtime: '⏱️ Total Playtime',
      chat: '💬 Chat Messages',
      chatValue: '{count}',
      playerOfDay: '🏆 Player of the Day',
      noData: 'No activity yet today.',
      footer: 'MCStatsBot • Daily Report',
    },
    playtime: {
      title: '⏱️ Playtime Ranking',
      top10: '🏅 Top 10 Playtime',
      earlyBird: '🌅 Early Bird',
      nightOwl: '🦉 Night Owl',
      longestSession: '🎮 Longest Session',
      average: '📊 Average Playtime',
    },
    combat: {
      title: '⚔️ Combat Statistics',
      mobKills: '⚔️ Total Mob Kills',
      deaths: '💀 Total Deaths',
      topHunters: '🏹 Top Mob Hunters',
      mostDeaths: '💀 Most Deaths',
      deathsCount: '{count} deaths',
      longestStreak: '💪 Longest Kill Streak',
      streakValue: '{count} kills',
      pvpOverview: '🗡️ PvP Overview',
      mobTypes: '🎯 Top Mob Types',
      deathStats: '📊 Death Statistics',
      cause: {
        mob: '⚔️ Mob/Player',
        fall: '🪂 Fall',
        lava: '🔥 Lava',
        drown: '💧 Drowned',
        fire: '🔥 Fire',
        starve: '🍖 Starvation',
        suffocation: '😮‍💨 Suffocation',
        other: '❓ Other',
      },
    },
    mining: {
      title: '⛏️ Mining & Building',
      broken: '⛏️ Blocks Broken',
      placed: '🏗️ Blocks Placed',
      rareFinds: '💎 Rare Finds',
      topMiners: '🏅 Top Miners',
      topBuilders: '🧱 Top Builders',
      topCrafters: '🔨 Top Crafters',
      blocks: 'blocks',
      items: 'items',
    },
    exploration: {
      title: '🗺️ Exploration & Movement',
      totalDistance: '🚶 Total Distance',
      netherPortals: '🌀 Nether Trips',
      endPortals: '🌌 End Trips',
      farthestWalker: '🏃 Farthest Walker',
      topExplorers: '🗺️ Top Explorers',
      chunks: 'new chunks',
    },
    achievements: {
      title: '🏆 Achievements & Progress',
      today: '🏆 Achievements Today ({count})',
      mostXp: '⭐ Most XP Earned',
    },
    funFacts: {
      title: '🎉 Fun Facts & More',
      blocksBroken: '{count} blocks were mined today.',
      blocksPillar: '{count} blocks were mined today — enough for a {height} block tall pillar.',
      distance: 'Players covered {km} km today.',
      distanceCircle: 'Today players walked {km} km — about {percent}% of a marathon.',
      mobKills: '{count} mobs were slain today. RIP.',
      chatMessages: '{count} chat messages flew through the server.',
      foodAward: '🍖 Glutton Award: **{name}** — {count}× food',
      potions: '🧪 {count} potions drunk',
      sleepAward: '💤 Sleepyhead Award: **{name}** — {count}× slept',
      topTrader: '📦 Top Trader: **{name}** — {count} trades',
      noActivity: "No stats yet for today — hop on the server and get started!",
    },
    records: {
      title: '📊 Records & Comparison',
      comparison: '📊 Comparison to Yesterday',
      playersLabel: '👥 Players',
      playtimeLabel: '⏱️ Playtime',
      same: 'same',
      weekTrend: '📈 Player Trend (7 days)',
      alltimePlaytime: '🥇 All-Time: Playtime',
      alltimeMobKills: '🥇 All-Time: Mob Kills',
      alltimeDeaths: '🥇 All-Time: Deaths',
      alltimeMining: '🥇 All-Time: Mining',
      nextReport: 'MCStatsBot • Next report tomorrow',
    },
    events: {
      title: '📰 Recent Events',
      advancement: '{player} unlocked "{advancement}"',
      death: '{player} died',
      deathMessage: '{message}',
      pvpKill: '{killer} defeated {victim} in PvP',
    },
    online: {
      title: '🟢 Online Players ({count})',
      afk: 'AFK',
    },
    playerStats: {
      title: '📊 Player Statistics — {player}',
      playtime: '⏱️ Playtime',
      mobKills: '🗡️ Mob Kills',
      deaths: '💀 Deaths',
      blocksBroken: '⛏️ Blocks Broken',
      blocksPlaced: '🧱 Blocks Placed',
      distance: '🗺️ Distance Walked',
      jumps: '🦘 Jumps',
      chatMessages: '💬 Messages',
      lastSeen: '👁️ Last Seen',
      firstJoin: '📅 First Join',
    },
  },
};

function t(lang, key, vars = {}) {
  const keys = key.split('.');
  let value = translations[lang] || translations.en;

  for (const k of keys) {
    value = value?.[k];
    if (value === undefined || value === null) {
      value = translations.en;
      for (const k2 of keys) {
        value = value?.[k2];
        if (value === undefined || value === null) return key;
      }
      break;
    }
  }

  if (typeof value !== 'string') return key;

  return value.replace(/\{(\w+)\}/g, (_, name) => vars[name] ?? `{${name}}`);
}

function getSupportedLanguages() {
  return Object.keys(translations);
}

function isSupported(lang) {
  return lang in translations;
}

module.exports = { t, getSupportedLanguages, isSupported, translations };
