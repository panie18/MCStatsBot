const { Client, GatewayIntentBits, EmbedBuilder, REST, Routes, SlashCommandBuilder } = require('discord.js');
const db = require('./db');
const { t } = require('./i18n');

let client = null;

const COLOR = {
  primary: 0x5865F2,
  red: 0xED4245,
  green: 0x57F287,
  yellow: 0xFEE75C,
  pink: 0xEB459E,
  blue: 0x3498DB,
  orange: 0xE67E22,
  gold: 0xF1C40F,
};

function formatDuration(seconds) {
  seconds = Math.max(0, Math.floor(Number(seconds) || 0));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function formatDurationShort(seconds) {
  seconds = Math.max(0, Math.floor(Number(seconds) || 0));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function formatNumber(n) {
  n = Number(n) || 0;
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  return `${n}`;
}

function formatKm(meters) {
  const km = (Number(meters) || 0) / 1000;
  if (km < 10) return km.toFixed(2) + ' km';
  return km.toFixed(1) + ' km';
}

function medal(idx) {
  return ['🥇', '🥈', '🥉'][idx] || '  ';
}

function rankList(entries, fmt) {
  if (!entries || entries.length === 0) return null;
  return entries.slice(0, 10).map((e, i) => `${medal(i)} **${e.name}** — ${fmt(e)}`).join('\n');
}

function renderFunFact(fact, lang) {
  if (typeof fact === 'string') return fact;
  if (fact && typeof fact === 'object' && fact.key) {
    return t(lang, `funFacts.${fact.key}`, fact.vars || {});
  }
  return '';
}

function renderEvent(evt, lang) {
  if (!evt) return '';
  if (evt.type && evt.vars) {
    return `${evt.emoji || ''} ${t(lang, `events.${evt.type}`, evt.vars)} · \`${evt.time || '--:--'}\``;
  }
  if (evt.text) return `${evt.emoji || ''} ${evt.text} · \`${evt.time || '--:--'}\``;
  return '';
}

function createReportEmbeds(stats, serverName, sections, lang = 'en') {
  const embeds = [];
  const active = sections || ['overview', 'combat', 'mining', 'exploration', 'funfacts'];

  const overview = stats.overview || {};
  const combat = stats.combat || {};
  const mining = stats.mining || {};
  const exploration = stats.exploration || {};
  const weekly = stats.weekly || null;
  const events = stats.events || [];
  const playtimeRanking = stats.playtimeRanking || [];
  const funFacts = stats.funFacts || [];

  if (active.includes('overview')) {
    const e = new EmbedBuilder()
      .setTitle(t(lang, 'report.title', { server: serverName }))
      .setColor(COLOR.primary)
      .setFooter({ text: t(lang, 'report.footer') })
      .setTimestamp();

    e.addFields(
      { name: t(lang, 'report.players'), value: t(lang, 'report.playersValue', { active: overview.uniquePlayers || 0, new: overview.newPlayers || 0 }), inline: true },
      { name: t(lang, 'report.playtime'), value: formatDurationShort(overview.totalPlaytimeSeconds || 0), inline: true },
      { name: t(lang, 'report.chat'), value: t(lang, 'report.chatValue', { count: overview.chatMessages || 0 }), inline: true },
    );

    if (overview.playerOfDay) {
      e.addFields({
        name: t(lang, 'report.playerOfDay'),
        value: `**${overview.playerOfDay.name}** (${formatDurationShort(overview.playerOfDay.playtime || 0)})`,
        inline: false,
      });
    }
    embeds.push(e);
  }

  if (active.includes('overview') && playtimeRanking.length > 0) {
    const e = new EmbedBuilder()
      .setTitle(t(lang, 'playtime.title'))
      .setColor(COLOR.blue);
    const ranking = rankList(playtimeRanking, (r) => formatDuration(r.seconds));
    if (ranking) {
      e.addFields({ name: t(lang, 'playtime.top10'), value: ranking, inline: false });
    }
    if (overview.earlyBird) {
      e.addFields({ name: t(lang, 'playtime.earlyBird'), value: `**${overview.earlyBird.name}** (${overview.earlyBird.time})`, inline: true });
    }
    if (overview.nightOwl) {
      e.addFields({ name: t(lang, 'playtime.nightOwl'), value: `**${overview.nightOwl.name}** (${overview.nightOwl.time})`, inline: true });
    }
    if (overview.longestSession) {
      e.addFields({ name: t(lang, 'playtime.longestSession'), value: `**${overview.longestSession.name}** (${formatDuration(overview.longestSession.seconds)})`, inline: true });
    }
    if (overview.averagePlaytime) {
      e.addFields({ name: t(lang, 'playtime.average'), value: formatDuration(overview.averagePlaytime), inline: true });
    }
    if (e.data.fields && e.data.fields.length > 0) embeds.push(e);
  }

  if (active.includes('combat')) {
    const e = new EmbedBuilder()
      .setTitle(t(lang, 'combat.title'))
      .setColor(COLOR.red);
    const hasData = (combat.totalMobKills > 0) || (combat.totalDeaths > 0) || (combat.topKillers?.length > 0);
    if (!hasData) {
      e.setDescription(t(lang, 'report.noData'));
    } else {
      e.addFields(
        { name: t(lang, 'combat.mobKills'), value: formatNumber(combat.totalMobKills || 0), inline: true },
        { name: t(lang, 'combat.deaths'), value: `${combat.totalDeaths || 0}`, inline: true },
      );
      if (combat.topKillers?.length > 0) {
        e.addFields({
          name: t(lang, 'combat.topHunters'),
          value: combat.topKillers.slice(0, 5).map((k, i) => `${medal(i)} **${k.name}** — ${formatNumber(k.kills)}`).join('\n'),
          inline: false,
        });
      }
      if (combat.topDeaths?.length > 0) {
        e.addFields({
          name: t(lang, 'combat.mostDeaths'),
          value: combat.topDeaths.slice(0, 5).map((d) => `• **${d.name}** — ${t(lang, 'combat.deathsCount', { count: d.deaths })}`).join('\n'),
          inline: false,
        });
      }
      if (combat.longestStreak) {
        e.addFields({
          name: t(lang, 'combat.longestStreak'),
          value: `**${combat.longestStreak.name}** — ${t(lang, 'combat.streakValue', { count: combat.longestStreak.streak })}`,
          inline: false,
        });
      }
      if (combat.pvpKills?.length > 0) {
        e.addFields({
          name: t(lang, 'combat.pvpOverview'),
          value: combat.pvpKills.slice(0, 5).map(p => `🗡️ **${p.killer}** → ${p.victim}${p.weapon && p.weapon !== 'none' ? ` (${p.weapon})` : ''}`).join('\n'),
          inline: false,
        });
      }
      if (combat.mobTypes?.length > 0) {
        e.addFields({
          name: t(lang, 'combat.mobTypes'),
          value: combat.mobTypes.slice(0, 6).map(m => `${m.emoji || ''} ${m.type}: **${formatNumber(m.count)}**`).join('\n'),
          inline: false,
        });
      }
      if (combat.deathCauses && Object.keys(combat.deathCauses).length > 0) {
        const total = Object.values(combat.deathCauses).reduce((a, b) => a + b, 0);
        if (total > 0) {
          const lines = Object.entries(combat.deathCauses)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 4)
            .map(([cause, count]) => {
              const pct = Math.round((count / total) * 100);
              return `${t(lang, `combat.cause.${cause}`)}: **${pct}%** (${count})`;
            });
          e.addFields({ name: t(lang, 'combat.deathStats'), value: lines.join('\n'), inline: false });
        }
      }
    }
    embeds.push(e);
  }

  if (active.includes('mining')) {
    const e = new EmbedBuilder()
      .setTitle(t(lang, 'mining.title'))
      .setColor(COLOR.green);
    const hasData = (mining.totalBroken > 0) || (mining.totalPlaced > 0);
    if (!hasData) {
      e.setDescription(t(lang, 'report.noData'));
    } else {
      e.addFields(
        { name: t(lang, 'mining.broken'), value: formatNumber(mining.totalBroken || 0), inline: true },
        { name: t(lang, 'mining.placed'), value: formatNumber(mining.totalPlaced || 0), inline: true },
      );
      if (mining.rareBlocks?.length > 0) {
        e.addFields({
          name: t(lang, 'mining.rareFinds'),
          value: mining.rareBlocks.slice(0, 6).map(b => `${b.emoji || ''} **${b.name}** — ${b.count}× ${b.block}`).join('\n'),
          inline: false,
        });
      }
      if (mining.topMiners?.length > 0) {
        e.addFields({
          name: t(lang, 'mining.topMiners'),
          value: mining.topMiners.slice(0, 5).map((m, i) => `${medal(i)} **${m.name}** — ${formatNumber(m.total)} ${t(lang, 'mining.blocks')}`).join('\n'),
          inline: false,
        });
      }
      if (mining.topBuilders?.length > 0) {
        e.addFields({
          name: t(lang, 'mining.topBuilders'),
          value: mining.topBuilders.slice(0, 5).map((m, i) => `${medal(i)} **${m.name}** — ${formatNumber(m.total)} ${t(lang, 'mining.blocks')}`).join('\n'),
          inline: false,
        });
      }
      if (mining.topCrafters?.length > 0) {
        e.addFields({
          name: t(lang, 'mining.topCrafters'),
          value: mining.topCrafters.slice(0, 5).map(c => `🔨 **${c.name}** — ${formatNumber(c.total)} ${t(lang, 'mining.items')}`).join('\n'),
          inline: false,
        });
      }
    }
    embeds.push(e);
  }

  if (active.includes('exploration')) {
    const e = new EmbedBuilder()
      .setTitle(t(lang, 'exploration.title'))
      .setColor(COLOR.yellow);
    const hasData = (exploration.totalDistance > 0) || (exploration.topExplorers?.length > 0);
    if (!hasData) {
      e.setDescription(t(lang, 'report.noData'));
    } else {
      e.addFields(
        { name: t(lang, 'exploration.totalDistance'), value: formatKm(exploration.totalDistance || 0), inline: true },
        { name: t(lang, 'exploration.netherPortals'), value: `${exploration.netherPortals || 0}`, inline: true },
        { name: t(lang, 'exploration.endPortals'), value: `${exploration.endPortals || 0}`, inline: true },
      );
      if (exploration.farthestWalker) {
        e.addFields({
          name: t(lang, 'exploration.farthestWalker'),
          value: `🏃 **${exploration.farthestWalker.name}** (${formatKm(exploration.farthestWalker.distance)})`,
          inline: false,
        });
      }
      if (exploration.topExplorers?.length > 0) {
        e.addFields({
          name: t(lang, 'exploration.topExplorers'),
          value: exploration.topExplorers.slice(0, 5).map((x, i) => `${medal(i)} **${x.name}** — ${formatNumber(x.chunks)} ${t(lang, 'exploration.chunks')}`).join('\n'),
          inline: false,
        });
      }
    }
    embeds.push(e);
  }

  if (active.includes('achievements') && (stats.achievements?.length > 0 || stats.topXp?.length > 0)) {
    const e = new EmbedBuilder()
      .setTitle(t(lang, 'achievements.title'))
      .setColor(COLOR.gold);
    if (stats.achievements?.length > 0) {
      e.addFields({
        name: t(lang, 'achievements.today', { count: stats.achievements.length }),
        value: stats.achievements.slice(0, 8).map(a => `🏆 **${a.name}** → ${a.advancement}`).join('\n'),
        inline: false,
      });
    }
    if (stats.topXp?.length > 0) {
      e.addFields({
        name: t(lang, 'achievements.mostXp'),
        value: stats.topXp.slice(0, 5).map(x => `⭐ **${x.name}** — ${formatNumber(x.xp)} XP`).join('\n'),
        inline: false,
      });
    }
    embeds.push(e);
  }

  if (active.includes('funfacts')) {
    const e = new EmbedBuilder()
      .setTitle(t(lang, 'funFacts.title'))
      .setColor(COLOR.pink);
    const rendered = [];

    const totalBroken = mining.totalBroken || 0;
    if (totalBroken > 0) {
      rendered.push(t(lang, 'funFacts.blocksPillar', { count: formatNumber(totalBroken), height: formatNumber(totalBroken) }));
    }

    const totalDistance = exploration.totalDistance || 0;
    if (totalDistance > 0) {
      const km = (totalDistance / 1000).toFixed(2);
      const marathonPct = Math.round((totalDistance / 42195) * 100);
      if (marathonPct > 0) {
        rendered.push(t(lang, 'funFacts.distanceCircle', { km, percent: marathonPct }));
      } else {
        rendered.push(t(lang, 'funFacts.distance', { km }));
      }
    }

    const totalMobKills = combat.totalMobKills || 0;
    if (totalMobKills > 0) {
      rendered.push(t(lang, 'funFacts.mobKills', { count: formatNumber(totalMobKills) }));
    }

    const chatMessages = overview.chatMessages || 0;
    if (chatMessages > 0) {
      rendered.push(t(lang, 'funFacts.chatMessages', { count: formatNumber(chatMessages) }));
    }

    if (overview.foodAward) {
      rendered.push(t(lang, 'funFacts.foodAward', { name: overview.foodAward.name, count: overview.foodAward.count }));
    }
    if (overview.potionsDrunk !== undefined && overview.potionsDrunk > 0) {
      rendered.push(t(lang, 'funFacts.potions', { count: overview.potionsDrunk }));
    }
    if (overview.sleepAward) {
      rendered.push(t(lang, 'funFacts.sleepAward', { name: overview.sleepAward.name, count: overview.sleepAward.count }));
    }
    if (overview.topTrader) {
      rendered.push(t(lang, 'funFacts.topTrader', { name: overview.topTrader.name, count: overview.topTrader.trades }));
    }

    if (rendered.length === 0) {
      const structured = (funFacts || []).filter(f => f && typeof f === 'object' && f.key).map(f => renderFunFact(f, lang));
      structured.forEach(s => { if (s) rendered.push(s); });
    }

    e.setDescription(rendered.length > 0 ? rendered.map(f => `• ${f}`).join('\n') : t(lang, 'funFacts.noActivity'));
    embeds.push(e);
  }

  if (active.includes('records') && weekly) {
    const e = new EmbedBuilder()
      .setTitle(t(lang, 'records.title'))
      .setColor(COLOR.orange);

    if (stats.comparison) {
      const c = stats.comparison;
      const lines = [];
      if (c.players !== undefined) {
        const arrow = c.playersDiff > 0 ? '📈' : c.playersDiff < 0 ? '📉' : '➡️';
        const diff = c.playersDiff !== undefined && c.playersDiff !== 0 ? ` ${arrow} ${c.playersDiff > 0 ? '+' : ''}${c.playersDiff}` : ` ${arrow} ${t(lang, 'records.same')}`;
        lines.push(`${t(lang, 'records.playersLabel')}: ${c.playersYesterday || 0} → ${c.players || 0}${diff}`);
      }
      if (c.playtimeYesterday !== undefined && c.playtime !== undefined) {
        const diff = c.playtime - (c.playtimeYesterday || 0);
        const arrow = diff > 0 ? '📈' : diff < 0 ? '📉' : '➡️';
        const pct = c.playtimeYesterday > 0 ? Math.round((diff / c.playtimeYesterday) * 100) : 0;
        lines.push(`${t(lang, 'records.playtimeLabel')}: ${formatDurationShort(c.playtime)} ${arrow} ${diff > 0 ? '+' : ''}${pct}%`);
      }
      if (lines.length > 0) {
        e.addFields({ name: t(lang, 'records.comparison'), value: lines.join('\n'), inline: false });
      }
    }

    if (weekly.days && weekly.days.length > 0) {
      const max = Math.max(...weekly.days.map(d => d.players || 0), 1);
      const bars = weekly.days.map(d => {
        const n = d.players || 0;
        const barLen = Math.round((n / max) * 10);
        const bar = '█'.repeat(barLen) || '·';
        return `\`${d.label || d.day}\` │ ${bar} ${n}`;
      }).join('\n');
      e.addFields({ name: t(lang, 'records.weekTrend'), value: bars, inline: false });
    }

    if (stats.allTime) {
      const at = stats.allTime;
      if (at.playtime?.length > 0) {
        e.addFields({
          name: t(lang, 'records.alltimePlaytime'),
          value: at.playtime.slice(0, 3).map((p, i) => `${medal(i)} **${p.name}** (${formatDuration(p.seconds)})`).join('\n'),
          inline: true,
        });
      }
      if (at.mobKills?.length > 0) {
        e.addFields({
          name: t(lang, 'records.alltimeMobKills'),
          value: at.mobKills.slice(0, 3).map((p, i) => `${medal(i)} **${p.name}** (${formatNumber(p.kills)})`).join('\n'),
          inline: true,
        });
      }
      if (at.deaths?.length > 0) {
        e.addFields({
          name: t(lang, 'records.alltimeDeaths'),
          value: at.deaths.slice(0, 3).map((p, i) => `${medal(i)} **${p.name}** (${p.deaths})`).join('\n'),
          inline: true,
        });
      }
      if (at.mining?.length > 0) {
        e.addFields({
          name: t(lang, 'records.alltimeMining'),
          value: at.mining.slice(0, 3).map((p, i) => `${medal(i)} **${p.name}** (${formatNumber(p.total)})`).join('\n'),
          inline: true,
        });
      }
    }

    e.setFooter({ text: t(lang, 'records.nextReport') });
    if (e.data.fields && e.data.fields.length > 0) embeds.push(e);
  }

  if (active.includes('events') && events.length > 0) {
    const e = new EmbedBuilder()
      .setTitle(t(lang, 'events.title'))
      .setColor(COLOR.primary)
      .setDescription(events.slice(0, 8).map(ev => renderEvent(ev, lang)).filter(Boolean).join('\n'));
    embeds.push(e);
  }

  return embeds;
}

function createPlayerStatsEmbed(playerData, playerName, lang = 'en') {
  const embed = new EmbedBuilder()
    .setTitle(t(lang, 'playerStats.title', { player: playerName }))
    .setColor(COLOR.primary)
    .setTimestamp();

  const fields = [];

  if (playerData.playtime !== undefined) {
    fields.push({ name: t(lang, 'playerStats.playtime'), value: formatDuration(playerData.playtime), inline: true });
  }
  if (playerData.mobKills !== undefined) {
    fields.push({ name: t(lang, 'playerStats.mobKills'), value: formatNumber(playerData.mobKills), inline: true });
  }
  if (playerData.deaths !== undefined) {
    fields.push({ name: t(lang, 'playerStats.deaths'), value: `${playerData.deaths}`, inline: true });
  }
  if (playerData.blocksBroken !== undefined) {
    fields.push({ name: t(lang, 'playerStats.blocksBroken'), value: formatNumber(playerData.blocksBroken), inline: true });
  }
  if (playerData.blocksPlaced !== undefined) {
    fields.push({ name: t(lang, 'playerStats.blocksPlaced'), value: formatNumber(playerData.blocksPlaced), inline: true });
  }
  if (playerData.distance !== undefined) {
    fields.push({ name: t(lang, 'playerStats.distance'), value: formatKm(playerData.distance), inline: true });
  }
  if (playerData.jumps !== undefined) {
    fields.push({ name: t(lang, 'playerStats.jumps'), value: formatNumber(playerData.jumps), inline: true });
  }
  if (playerData.chatMessages !== undefined) {
    fields.push({ name: t(lang, 'playerStats.chatMessages'), value: `${playerData.chatMessages}`, inline: true });
  }
  if (playerData.lastSeen) {
    fields.push({ name: t(lang, 'playerStats.lastSeen'), value: playerData.lastSeen, inline: true });
  }
  if (playerData.firstJoin) {
    fields.push({ name: t(lang, 'playerStats.firstJoin'), value: playerData.firstJoin, inline: true });
  }

  if (fields.length > 0) {
    embed.addFields(fields);
  }

  return embed;
}

async function start() {
  client = new Client({
    intents: [GatewayIntentBits.Guilds],
  });

  client.on('ready', async () => {
    console.log(`[Bot] ${t('en', 'bot.loggedIn', { tag: client.user.tag })}`);

    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);
    try {
      await rest.put(Routes.applicationCommands(client.user.id), {
        body: [
          new SlashCommandBuilder()
            .setName('stats')
            .setDescription('Server statistics / Server-Statistiken')
            .setDescriptionLocalizations({
              de: 'Zeigt aktuelle Server-Statistiken',
              'en-US': 'Shows current server statistics',
              'en-GB': 'Shows current server statistics',
            }),
          new SlashCommandBuilder()
            .setName('online')
            .setDescription('Online players / Online Spieler')
            .setDescriptionLocalizations({
              de: 'Zeigt online Spieler',
              'en-US': 'Shows online players',
              'en-GB': 'Shows online players',
            }),
          new SlashCommandBuilder()
            .setName('playerstats')
            .setDescription('Player statistics / Spielerstatistiken')
            .setDescriptionLocalizations({
              de: 'Zeigt Statistiken für einen Spieler',
              'en-US': 'Shows statistics for a player',
              'en-GB': 'Shows statistics for a player',
            })
            .addStringOption(option =>
              option
                .setName('player')
                .setDescription('Player name / Spielername')
                .setDescriptionLocalizations({
                  de: 'Name des Spielers',
                  'en-US': 'Name of the player',
                  'en-GB': 'Name of the player',
                })
                .setRequired(true),
            ),
        ],
      });
      console.log('[Bot] Slash commands registered');
    } catch (e) {
      console.error('[Bot] Error registering commands:', e.message);
    }
  });

  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const servers = db.getAllServers().filter(s => s.guild_id === interaction.guildId);
    if (servers.length === 0) {
      const lang = interaction.locale.startsWith('de') ? 'de' : 'en';
      await interaction.reply({ content: t(lang, 'commands.noServer'), ephemeral: true });
      return;
    }

    const server = servers[0];
    const lang = server.language || (interaction.locale.startsWith('de') ? 'de' : 'en');
    const latestStats = db.getLatestStats(server.id);

    if (interaction.commandName === 'stats') {
      if (!latestStats) {
        await interaction.reply({ content: t(lang, 'commands.noStats'), ephemeral: true });
        return;
      }
      const sections = (server.report_sections || 'overview,combat,mining,exploration,funfacts').split(',');
      const embeds = createReportEmbeds(latestStats.data, server.server_name, sections, lang);
      await interaction.reply({ embeds: embeds.slice(0, 10) });
    }

    if (interaction.commandName === 'online') {
      if (!latestStats?.data?.onlinePlayers) {
        await interaction.reply({ content: t(lang, 'commands.noOnlineData'), ephemeral: true });
        return;
      }
      const players = latestStats.data.onlinePlayers;
      if (players.length === 0) {
        await interaction.reply(t(lang, 'commands.nobodyOnline'));
        return;
      }
      const list = players.map(p => `• **${p.name}** (${p.world}${p.afk ? `, ${t(lang, 'online.afk')}` : ''})`).join('\n');
      const embed = new EmbedBuilder()
        .setTitle(t(lang, 'online.title', { count: players.length }))
        .setDescription(list)
        .setColor(COLOR.green);
      await interaction.reply({ embeds: [embed] });
    }

    if (interaction.commandName === 'playerstats') {
      const playerName = interaction.options.getString('player');

      if (!latestStats?.data?.playerStats) {
        await interaction.reply({ content: t(lang, 'commands.noStats'), ephemeral: true });
        return;
      }

      const playerStats = latestStats.data.playerStats;
      const playerKey = Object.keys(playerStats).find(
        k => k.toLowerCase() === playerName.toLowerCase(),
      );

      if (!playerKey) {
        await interaction.reply({ content: t(lang, 'commands.playerNotFound', { player: playerName }), ephemeral: true });
        return;
      }

      const playerData = playerStats[playerKey];
      if (!playerData || Object.keys(playerData).length === 0) {
        await interaction.reply({ content: t(lang, 'commands.noPlayerStats'), ephemeral: true });
        return;
      }

      const embed = createPlayerStatsEmbed(playerData, playerKey, lang);
      await interaction.reply({ embeds: [embed] });
    }
  });

  await client.login(process.env.DISCORD_BOT_TOKEN);
  return client;
}

const reportCooldowns = new Map();

async function sendReport(serverId) {
  const server = db.getServer(serverId);
  if (!server || !client) return;
  if (!server.channel_id || !server.guild_id) return;

  const lang = server.language || 'en';

  const now = Date.now();
  const key = serverId;
  const history = reportCooldowns.get(key) || [];
  const recentSends = history.filter(tt => now - tt < 3600000);
  if (recentSends.length >= 5) {
    console.warn(`[Bot] ${t('en', 'bot.rateLimited', { server: serverId })}`);
    return;
  }

  const latestStats = db.getLatestStats(serverId);
  if (!latestStats) return;

  try {
    const channel = await client.channels.fetch(server.channel_id);
    if (!channel) return;

    if (channel.guildId !== server.guild_id) {
      console.error(`[Bot] ${t('en', 'bot.securityError', { channel: server.channel_id, guild: server.guild_id })}`);
      return;
    }

    const sections = (server.report_sections || 'overview,combat,mining,exploration,funfacts,achievements,records,events').split(',');
    const embeds = createReportEmbeds(latestStats.data, server.server_name, sections, lang);
    await channel.send({ embeds: embeds.slice(0, 10) });

    recentSends.push(now);
    reportCooldowns.set(key, recentSends);
    console.log(`[Bot] ${t('en', 'bot.reportSent', { server: server.server_name, channel: channel.name })}`);
  } catch (e) {
    console.error(`[Bot] Error sending report for ${serverId}:`, e.message);
  }
}

function getClient() {
  return client;
}

function getInviteUrl() {
  return `https://discord.com/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&scope=bot+applications.commands&permissions=2048`;
}

module.exports = { start, sendReport, getClient, getInviteUrl };
