import { useState, useEffect, useRef } from 'react';
import Card from './components/Card';
import Chip from './components/Chip';
import StatsCard from './components/StatsCard';

import LeaderboardRow from './components/LeaderboardRow';
import {
  tokens,
  palettes,
  getTimePeriod,
  paletteToCSS,
  TimePeriod,
} from './tokens';
import type { StatsData } from './data';
import { formatDuration, formatNumber, formatDistance, skinUrl, getDemoData } from './data';
import StatusPage from './components/StatusPage';

// ── Animierter Zaehler-Hook — exakt wie Weather App ──
function useAnimatedValue(target: number | null, duration = 600) {
  const [display, setDisplay] = useState<number | null>(null);
  const ref = useRef<number | null>(null);

  useEffect(() => {
    if (target === null) return;
    const start = ref.current ?? target;
    const diff = target - start;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = start + diff * eased;
      setDisplay(Math.round(current));
      ref.current = current;
      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [target, duration]);

  return display;
}

type View = 'overview' | 'players' | 'combat' | 'mining' | 'exploration' | 'weekly' | 'status';

const views: { id: View; icon: string; label: string }[] = [
  { id: 'overview', icon: 'dashboard', label: 'Uebersicht' },
  { id: 'players', icon: 'group', label: 'Spieler' },
  { id: 'combat', icon: 'swords', label: 'Kampf' },
  { id: 'mining', icon: 'construction', label: 'Mining' },
  { id: 'exploration', icon: 'explore', label: 'Erkundung' },
  { id: 'weekly', icon: 'date_range', label: '7 Tage' },
  { id: 'status', icon: 'monitoring', label: 'Status' },
];

export default function App() {
  const [data, setData] = useState<StatsData | null>(null);
  const [health, setHealth] = useState<any>(null);
  const [view, setView] = useState<View>('overview');
  const [timePeriod, setTimePeriod] = useState<TimePeriod>(
    getTimePeriod(new Date().getHours()),
  );

  // Tageszeit jede Minute pruefen — wie Weather App
  useEffect(() => {
    const iv = setInterval(() => {
      setTimePeriod(getTimePeriod(new Date().getHours()));
    }, 60_000);
    return () => clearInterval(iv);
  }, []);

  const p = palettes[timePeriod];

  // Daten laden
  useEffect(() => {
    const fetchData = async () => {
      try {
        const r = await fetch('/api/stats');
        const ct = r.headers.get('content-type') || '';
        if (r.ok && ct.includes('application/json')) {
          setData(await r.json());
          return;
        }
      } catch { /* fallback */ }
      setData(getDemoData());
    };

    fetchData();
    const iv = setInterval(fetchData, 30_000);
    return () => clearInterval(iv);
  }, []);

  // Health poll for footer indicator
  useEffect(() => {
    let mounted = true;
    const fetchHealth = async () => {
      try {
        const r = await fetch('/api/health');
        const ct = r.headers.get('content-type') || '';
        if (r.ok && ct.includes('application/json')) {
          const json = await r.json();
          if (mounted) setHealth(json);
          return;
        }
      } catch {
        // ignore
      }
      if (mounted) setHealth(null);
    };

    fetchHealth();
    const iv = setInterval(fetchHealth, 30_000);
    return () => { mounted = false; clearInterval(iv); };
  }, []);

  // Animierte Werte
  const onlineAnim = useAnimatedValue(data?.onlinePlayers?.length ?? null);
  const killsAnim = useAnimatedValue(data?.combat?.totalMobKills ?? null);
  const blocksAnim = useAnimatedValue(data?.mining?.totalBroken ?? null);

  if (!data) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: p.surface,
        color: p.onSurface,
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: 48, opacity: 0.3 }}>
          hourglass_empty
        </span>
      </div>
    );
  }

  return (
    <>
      <style>{`:root { ${paletteToCSS(p)} }`}</style>

      <div
        style={{
          minHeight: '100vh',
          background: p.surface,
          color: p.onSurface,
          padding: '24px 16px',
          transition: 'background 1s ease, color 1s ease',
        }}
      >
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>

          {/* ── Header — wie Weather App ── */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '24px',
          }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: '12px',
              background: p.primaryContainer,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 24, color: p.onPrimaryContainer }}>
                monitoring
              </span>
            </div>
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: 600 }}>
                MCStatsBot
              </h1>
              <p style={{ fontSize: '13px', opacity: 0.6 }}>
                {data.serverName}
              </p>
            </div>
          </div>

          {/* ── View Chips — wie Sensor Chips in Weather App ── */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            marginBottom: '16px',
          }}>
            {views.map((v) => (
              <Chip
                key={v.id}
                label={v.label}
                icon={v.icon}
                selected={view === v.id}
                color="primary"
                onClick={() => setView(v.id)}
              />
            ))}
          </div>

          {/* ── Content ── */}
          {view === 'overview' && <OverviewView p={p} d={data} onlineAnim={onlineAnim} killsAnim={killsAnim} blocksAnim={blocksAnim} />}
          {view === 'players' && <PlayersView p={p} d={data} />}
          {view === 'combat' && <CombatView p={p} d={data} killsAnim={killsAnim} />}
          {view === 'mining' && <MiningView p={p} d={data} blocksAnim={blocksAnim} />}
          {view === 'exploration' && <ExplorationView p={p} d={data} />}
          {view === 'weekly' && <WeeklyView p={p} d={data} />}
          {view === 'status' && <StatusPage data={data} />}

          {/* ── Footer — wie Weather App ── */}
          <p style={{
            textAlign: 'center',
            fontSize: '12px',
            opacity: 0.4,
            marginTop: '24px',
            paddingBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              MCStatsBot Dashboard v1 — Live Server Statistiken
            </span>
            <button onClick={() => setView('status')} title={health ? (health.ok ? 'Server OK' : 'Server Problem') : 'Status unknown'} style={{
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              padding: 6,
              display: 'inline-flex',
              alignItems: 'center',
            }}>
              <span style={{ width: 12, height: 12, borderRadius: 12, display: 'inline-block', boxShadow: '0 0 6px rgba(0,0,0,0.08)',
                background: (function() {
                  if (!health) return '#9E9E9E';
                  if (health.ok) return '#4CAF50';
                  if (health.status === 'degraded') return '#FB8C00';
                  return '#E53935';
                })()
              }} />
            </button>
          </p>
        </div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════
//  VIEWS — jede View nutzt Card + StatsCard wie Weather App
// ═══════════════════════════════════════════════════════════════

interface ViewProps {
  p: typeof palettes.morning;
  d: StatsData;
  onlineAnim?: number | null;
  killsAnim?: number | null;
  blocksAnim?: number | null;
}

function OverviewView({ p, d, onlineAnim, killsAnim, blocksAnim }: ViewProps) {
  const o = d.overview;
  const online = d.onlinePlayers?.length || 0;

  return (
    <>
      {/* Aktuelle Werte — wie "Aktuelle Werte" Card der Weather App */}
      <Card style={{ marginBottom: '16px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: tokens.onSurface }}>
          Server Status
        </h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
          <StatsCard
            icon="group"
            label="Online Spieler"
            cardRadius="48px"
            cardBg={p.primaryContainer}
            cardOnBg={p.onPrimaryContainer}
            iconBg={p.primary}
            iconColor={p.onPrimary}
            iconShape="circle"
            iconMorphTo="pill"
            value={<>{onlineAnim ?? online}</>}
            sub={`${o.uniquePlayers} heute aktiv`}
          />
          <StatsCard
            icon="schedule"
            label="Spielzeit"
            cardRadius="48px 48px 12px 12px"
            cardBg={p.tertiaryContainer}
            cardOnBg={p.onTertiaryContainer}
            iconBg={p.tertiary}
            iconColor={p.onTertiary}
            iconShape="9-sided-cookie"
            iconMorphTo="12-sided-cookie"
            value={formatDuration(o.totalPlaytimeSeconds)}
          />
          <StatsCard
            icon="chat"
            label="Nachrichten"
            cardRadius="48px 48px 48px 8px"
            cardBg={p.secondaryContainer}
            cardOnBg={p.onSecondaryContainer}
            iconBg={p.secondary}
            iconColor={p.onSecondary}
            iconShape="arrow"
            iconMorphTo="soft-burst"
            value={formatNumber(o.chatMessages)}
            sub="Chat heute"
          />
          <StatsCard
            icon="swords"
            label="Mob-Kills"
            cardRadius="48px 8px 48px 8px"
            cardBg={p.primaryContainer}
            cardOnBg={p.onPrimaryContainer}
            iconBg={p.primary}
            iconColor={p.onPrimary}
            iconShape="pill"
            iconMorphTo="bun"
            value={<>{killsAnim ?? formatNumber(d.combat.totalMobKills)}</>}
            sub={`${d.combat.totalDeaths} Tode`}
          />
          <StatsCard
            icon="construction"
            label="Abgebaut"
            cardRadius="8px 8px 48px 48px"
            cardBg={p.tertiaryContainer}
            cardOnBg={p.onTertiaryContainer}
            iconBg={p.tertiary}
            iconColor={p.onTertiary}
            iconShape="sunny"
            iconMorphTo="very-sunny"
            value={<>{blocksAnim ?? formatNumber(d.mining.totalBroken)}</>}
            sub={`${formatNumber(d.mining.totalPlaced)} platziert`}
          />
          <StatsCard
            icon="person_add"
            label="Neue Spieler"
            cardRadius="8px 48px 48px 48px"
            cardBg={p.secondaryContainer}
            cardOnBg={p.onSecondaryContainer}
            iconBg={p.secondary}
            iconColor={p.onSecondary}
            iconShape="8-leaf-clover"
            iconMorphTo="flower"
            value={String(o.newPlayers)}
            sub="Erstbesuche heute"
          />
          {o.playerOfDay && (
            <StatsCard
              icon="emoji_events"
              label="Spieler des Tages"
              cardRadius="28px"
              cardBg={p.tertiaryContainer}
              cardOnBg={p.onTertiaryContainer}
              iconBg={p.tertiary}
              iconColor={p.onTertiary}
              iconShape="12-sided-cookie"
              iconMorphTo="9-sided-cookie"
              value={o.playerOfDay.name}
              sub={formatDuration(o.playerOfDay.playtime)}
            />
          )}
        </div>
      </Card>

      {/* Online Spieler */}
      {d.onlinePlayers.length > 0 && (
        <Card style={{ marginBottom: '16px', padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20, color: tokens.primary }}>
                group
              </span>
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: tokens.onSurface }}>
                Online Spieler
              </h2>
              <div style={{
                marginLeft: 'auto',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 14px 4px 8px',
                borderRadius: '9999px',
                background: tokens.primary,
                color: tokens.onPrimary,
                fontSize: 13,
                fontWeight: 500,
              }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#4CAF50', boxShadow: '0 0 6px #4CAF5088', display: 'inline-block' }} />
                {online} online
              </div>
            </div>
          </div>
          {d.onlinePlayers.map((pl) => (
            <LeaderboardRow
              key={pl.name}
              rank={-1}
              icon={pl.afk ? 'bedtime' : 'circle'}
              avatar={skinUrl(pl.name)}
              name={pl.name}
              detail={pl.world === 'nether' ? 'Nether' : pl.world === 'end' ? 'End' : 'Overworld'}
              value={formatDuration(pl.sessionSeconds)}
            />
          ))}
        </Card>
      )}

      {/* Letzte Events */}
      {d.events.length > 0 && (
        <Card style={{ marginBottom: '16px', padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20, color: tokens.primary }}>
                timeline
              </span>
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: tokens.onSurface }}>
                Letzte Events
              </h2>
            </div>
          </div>
          {d.events.map((e, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '12px 20px', gap: '12px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 22, color: tokens.primary, flexShrink: 0 }}>
                {eventIcon(e.emoji)}
              </span>
              <div style={{ flex: 1, fontSize: 14, color: tokens.onSurface, lineHeight: 1.4 }}>{e.text}</div>
              <div style={{ fontSize: 12, color: tokens.outline, flexShrink: 0 }}>{e.time}</div>
            </div>
          ))}
        </Card>
      )}

      {/* Fun Fact */}
      {d.funFacts.length > 0 && (
        <Card style={{
          marginBottom: '16px',
          background: p.tertiaryContainer,
          border: 'none',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: p.onTertiaryContainer, opacity: 0.7 }}>
              smart_toy
            </span>
            <span style={{ fontSize: 13, fontWeight: 600, color: p.onTertiaryContainer, opacity: 0.7, letterSpacing: '.3px', textTransform: 'uppercase' }}>
              Fun Fact
            </span>
          </div>
          <div style={{ fontSize: 16, fontWeight: 400, color: p.onTertiaryContainer, lineHeight: 1.5 }}>
            {d.funFacts[Math.floor(Math.random() * d.funFacts.length)]}
          </div>
        </Card>
      )}
    </>
  );
}

function PlayersView({ p, d }: ViewProps) {
  return (
    <>
      {/* Spieler Highlights */}
      <Card style={{ marginBottom: '16px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: tokens.onSurface }}>
          Spieler Highlights
        </h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
          <StatsCard
            icon="wb_sunny"
            label="Fruehster Spieler"
            cardRadius="48px"
            cardBg={p.primaryContainer}
            cardOnBg={p.onPrimaryContainer}
            iconBg={p.primary}
            iconColor={p.onPrimary}
            iconShape="sunny"
            iconMorphTo="very-sunny"
            value={d.overview.earlyBird?.name || '—'}
            sub={d.overview.earlyBird?.time || ''}
          />
          <StatsCard
            icon="dark_mode"
            label="Nachteule"
            cardRadius="48px 48px 12px 12px"
            cardBg={p.tertiaryContainer}
            cardOnBg={p.onTertiaryContainer}
            iconBg={p.tertiary}
            iconColor={p.onTertiary}
            iconShape="9-sided-cookie"
            iconMorphTo="12-sided-cookie"
            value={d.overview.nightOwl?.name || '—'}
            sub={d.overview.nightOwl?.time || ''}
          />
          <StatsCard
            icon="chat_bubble"
            label="Nachrichten"
            cardRadius="48px 48px 48px 8px"
            cardBg={p.secondaryContainer}
            cardOnBg={p.onSecondaryContainer}
            iconBg={p.secondary}
            iconColor={p.onSecondary}
            iconShape="pill"
            iconMorphTo="bun"
            value={formatNumber(d.overview.chatMessages)}
            sub="Chat heute"
          />
        </div>
      </Card>

      {/* Spielzeit-Ranking */}
      <Card style={{ marginBottom: '16px', padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: tokens.primary }}>
              leaderboard
            </span>
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: tokens.onSurface }}>
              Spielzeit-Ranking
            </h2>
          </div>
        </div>
        {d.playtimeRanking.map((pl, i) => (
          <LeaderboardRow
            key={pl.name}
            rank={i}
            avatar={skinUrl(pl.name)}
            name={pl.name}
            value={formatDuration(pl.seconds)}
          />
        ))}
      </Card>
    </>
  );
}

function CombatView({ p, d, killsAnim }: ViewProps) {
  const cb = d.combat;
  const maxMob = cb.mobTypes.length ? Math.max(...cb.mobTypes.map((m) => m.count)) : 1;

  return (
    <>
      <Card style={{ marginBottom: '16px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: tokens.onSurface }}>
          Kampf Statistiken
        </h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
          <StatsCard
            icon="swords"
            label="Mob-Kills"
            cardRadius="48px"
            cardBg={p.errorContainer}
            cardOnBg={p.onErrorContainer}
            iconBg={p.error}
            iconColor={p.onError}
            iconShape="circle"
            iconMorphTo="soft-burst"
            value={<>{killsAnim ?? formatNumber(cb.totalMobKills)}</>}
            sub="heute getoetet"
          />
          <StatsCard
            icon="skull"
            label="Tode"
            cardRadius="48px 48px 12px 12px"
            cardBg={p.secondaryContainer}
            cardOnBg={p.onSecondaryContainer}
            iconBg={p.secondary}
            iconColor={p.onSecondary}
            iconShape="9-sided-cookie"
            iconMorphTo="12-sided-cookie"
            value={String(cb.totalDeaths)}
            sub="heute gestorben"
          />
          {cb.longestStreak && (
            <StatsCard
              icon="local_fire_department"
              label="Kill-Streak"
              cardRadius="48px 8px 48px 8px"
              cardBg={p.primaryContainer}
              cardOnBg={p.onPrimaryContainer}
              iconBg={p.primary}
              iconColor={p.onPrimary}
              iconShape="sunny"
              iconMorphTo="very-sunny"
              value={String(cb.longestStreak.streak)}
              sub={cb.longestStreak.name}
            />
          )}
        </div>
      </Card>

      {cb.funniestDeath && (
        <Card style={{
          marginBottom: '16px',
          background: p.errorContainer,
          border: 'none',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: p.error, opacity: 0.7 }}>
              sentiment_very_dissatisfied
            </span>
            <span style={{ fontSize: 13, fontWeight: 600, color: p.error, opacity: 0.7, letterSpacing: '.3px', textTransform: 'uppercase' }}>
              Peinlichster Tod
            </span>
          </div>
          <div style={{ fontSize: 16, fontWeight: 400, color: p.onErrorContainer, lineHeight: 1.5 }}>
            {cb.funniestDeath.message}
          </div>
        </Card>
      )}

      {/* Top Jaeger */}
      <Card style={{ marginBottom: '16px', padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: tokens.primary }}>swords</span>
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: tokens.onSurface }}>Top Jaeger</h2>
          </div>
        </div>
        {cb.topKillers.map((pl, i) => (
          <LeaderboardRow key={pl.name} rank={i} avatar={skinUrl(pl.name)} name={pl.name} value={`${formatNumber(pl.kills)} Kills`} />
        ))}
      </Card>

      {/* Mob-Verteilung */}
      <Card style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 20, color: tokens.primary }}>pest_control</span>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: tokens.onSurface }}>Mob-Verteilung</h2>
        </div>
        {cb.mobTypes.map((m) => (
          <div key={m.type} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <div style={{ width: 50, fontSize: 12, fontWeight: 500, color: tokens.outline, textAlign: 'right', flexShrink: 0 }}>
              {m.type}
            </div>
            <div style={{ flex: 1, height: 24, background: tokens.surfaceContainer, borderRadius: '9999px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.max(2, (m.count / maxMob) * 100)}%`, background: tokens.primary, borderRadius: '9999px', transition: 'width .6s cubic-bezier(.4,0,.2,1)' }} />
            </div>
            <div style={{ width: 36, fontSize: 12, fontWeight: 500, color: tokens.onSurface, flexShrink: 0 }}>
              {formatNumber(m.count)}
            </div>
          </div>
        ))}
      </Card>

      {/* PvP */}
      {cb.pvpKills.length > 0 && (
        <Card style={{ marginBottom: '16px', padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20, color: tokens.primary }}>sports_kabaddi</span>
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: tokens.onSurface }}>PvP Kills</h2>
            </div>
          </div>
          {cb.pvpKills.map((k, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '12px 20px', gap: '12px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 22, color: tokens.primary, flexShrink: 0 }}>gavel</span>
              <div style={{ flex: 1, fontSize: 14, color: tokens.onSurface, lineHeight: 1.4 }}>{k.killer} → {k.victim}</div>
              <div style={{ fontSize: 12, color: tokens.outline, flexShrink: 0 }}>{k.weapon}</div>
            </div>
          ))}
        </Card>
      )}
    </>
  );
}

function MiningView({ p, d, blocksAnim }: ViewProps) {
  const m = d.mining;

  return (
    <>
      <Card style={{ marginBottom: '16px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: tokens.onSurface }}>
          Mining Statistiken
        </h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
          <StatsCard
            icon="hardware"
            label="Abgebaut"
            cardRadius="48px"
            cardBg={p.primaryContainer}
            cardOnBg={p.onPrimaryContainer}
            iconBg={p.primary}
            iconColor={p.onPrimary}
            iconShape="circle"
            iconMorphTo="pill"
            value={<>{blocksAnim ?? formatNumber(m.totalBroken)}</>}
            sub="Bloecke"
          />
          <StatsCard
            icon="deployed_code"
            label="Platziert"
            cardRadius="48px 48px 12px 12px"
            cardBg={p.tertiaryContainer}
            cardOnBg={p.onTertiaryContainer}
            iconBg={p.tertiary}
            iconColor={p.onTertiary}
            iconShape="9-sided-cookie"
            iconMorphTo="12-sided-cookie"
            value={formatNumber(m.totalPlaced)}
            sub="Bloecke"
          />
          <StatsCard
            icon="diamond"
            label="Seltene Funde"
            cardRadius="48px 48px 48px 8px"
            cardBg={p.secondaryContainer}
            cardOnBg={p.onSecondaryContainer}
            iconBg={p.secondary}
            iconColor={p.onSecondary}
            iconShape="8-leaf-clover"
            iconMorphTo="flower"
            value={String(m.rareBlocks.length)}
            sub="verschiedene"
          />
        </div>
      </Card>

      {/* Seltene Funde */}
      {m.rareBlocks.length > 0 && (
        <Card style={{ marginBottom: '16px', padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20, color: tokens.primary }}>diamond</span>
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: tokens.onSurface }}>Seltene Funde</h2>
            </div>
          </div>
          {m.rareBlocks.map((b, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '12px 20px', gap: '12px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 22, color: tokens.primary, flexShrink: 0 }}>diamond</span>
              <div style={{ flex: 1, fontSize: 14, color: tokens.onSurface, lineHeight: 1.4 }}>{b.name} — {b.count}x {b.block}</div>
            </div>
          ))}
        </Card>
      )}

      {/* Top Miner */}
      <Card style={{ marginBottom: '16px', padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: tokens.primary }}>construction</span>
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: tokens.onSurface }}>Top Miner</h2>
          </div>
        </div>
        {m.topMiners.map((pl, i) => (
          <LeaderboardRow key={pl.name} rank={i} avatar={skinUrl(pl.name)} name={pl.name} value={formatNumber(pl.total)} />
        ))}
      </Card>

      {/* Top Baumeister */}
      <Card style={{ marginBottom: '16px', padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: tokens.primary }}>apartment</span>
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: tokens.onSurface }}>Top Baumeister</h2>
          </div>
        </div>
        {m.topBuilders.map((pl, i) => (
          <LeaderboardRow key={pl.name} rank={i} avatar={skinUrl(pl.name)} name={pl.name} value={formatNumber(pl.total)} />
        ))}
      </Card>
    </>
  );
}

function ExplorationView({ p, d }: ViewProps) {
  const e = d.exploration;
  const dist = formatDistance(e.totalDistance);

  return (
    <>
      <Card style={{ marginBottom: '16px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: tokens.onSurface }}>
          Erkundung
        </h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
          <StatsCard
            icon="directions_walk"
            label="Distanz heute"
            cardRadius="48px"
            cardBg={p.tertiaryContainer}
            cardOnBg={p.onTertiaryContainer}
            iconBg={p.tertiary}
            iconColor={p.onTertiary}
            iconShape="circle"
            iconMorphTo="pill"
            value={dist}
          />
          <StatsCard
            icon="swap_horiz"
            label="Nether-Portale"
            cardRadius="48px 48px 12px 12px"
            cardBg={p.primaryContainer}
            cardOnBg={p.onPrimaryContainer}
            iconBg={p.primary}
            iconColor={p.onPrimary}
            iconShape="arrow"
            iconMorphTo="soft-burst"
            value={String(e.netherPortals)}
          />
          <StatsCard
            icon="star"
            label="End-Portale"
            cardRadius="48px 48px 48px 8px"
            cardBg={p.secondaryContainer}
            cardOnBg={p.onSecondaryContainer}
            iconBg={p.secondary}
            iconColor={p.onSecondary}
            iconShape="sunny"
            iconMorphTo="very-sunny"
            value={String(e.endPortals)}
          />
        </div>
      </Card>

      {e.farthestWalker && (
        <Card style={{
          marginBottom: '16px',
          background: p.tertiaryContainer,
          border: 'none',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: p.onTertiaryContainer, opacity: 0.7 }}>
              directions_walk
            </span>
            <span style={{ fontSize: 13, fontWeight: 600, color: p.onTertiaryContainer, opacity: 0.7, letterSpacing: '.3px', textTransform: 'uppercase' }}>
              Wanderer des Tages
            </span>
          </div>
          <div style={{ fontSize: 16, fontWeight: 400, color: p.onTertiaryContainer, lineHeight: 1.5 }}>
            {e.farthestWalker.name} — {formatDistance(e.farthestWalker.distance)}
          </div>
        </Card>
      )}

      {/* Top Entdecker */}
      <Card style={{ marginBottom: '16px', padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: tokens.primary }}>travel_explore</span>
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: tokens.onSurface }}>Top Entdecker</h2>
          </div>
        </div>
        {e.topExplorers.map((pl, i) => (
          <LeaderboardRow key={pl.name} rank={i} avatar={skinUrl(pl.name)} name={pl.name} value={`${pl.chunks} Chunks`} />
        ))}
      </Card>
    </>
  );
}

function WeeklyView({ p, d }: ViewProps) {
  const w = d.weekly;
  const maxP = w.days.length ? Math.max(...w.days.map((day) => day.players)) : 1;

  return (
    <>
      <Card style={{ marginBottom: '16px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: tokens.onSurface }}>
          7-Tage Zusammenfassung
        </h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
          <StatsCard
            icon="group"
            label="Spieler"
            cardRadius="48px"
            cardBg={p.primaryContainer}
            cardOnBg={p.onPrimaryContainer}
            iconBg={p.primary}
            iconColor={p.onPrimary}
            iconShape="circle"
            iconMorphTo="pill"
            value={String(w.totalPlayers)}
            sub="gesamt"
          />
          <StatsCard
            icon="schedule"
            label="Spielzeit"
            cardRadius="48px 48px 12px 12px"
            cardBg={p.tertiaryContainer}
            cardOnBg={p.onTertiaryContainer}
            iconBg={p.tertiary}
            iconColor={p.onTertiary}
            iconShape="9-sided-cookie"
            iconMorphTo="12-sided-cookie"
            value={formatDuration(w.totalPlaytime)}
            sub="gesamt"
          />
          <StatsCard
            icon="swords"
            label="Kills"
            cardRadius="48px 8px 48px 8px"
            cardBg={p.secondaryContainer}
            cardOnBg={p.onSecondaryContainer}
            iconBg={p.secondary}
            iconColor={p.onSecondary}
            iconShape="arrow"
            iconMorphTo="soft-burst"
            value={formatNumber(w.totalKills)}
            sub="Mob-Kills"
          />
        </div>
      </Card>

      {/* Spieler pro Tag — Bar Chart */}
      <Card style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 20, color: tokens.primary }}>bar_chart</span>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: tokens.onSurface }}>Spieler pro Tag</h2>
        </div>
        <div style={{ fontSize: 14, fontWeight: 500, color: tokens.outline, marginBottom: 16, letterSpacing: '.1px' }}>
          Aktivitaetstrend (letzte 7 Tage)
        </div>
        {w.days.map((day) => (
          <div key={day.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <div style={{ width: 32, fontSize: 12, fontWeight: 500, color: tokens.outline, textAlign: 'right', flexShrink: 0 }}>
              {day.day}
            </div>
            <div style={{ flex: 1, height: 24, background: tokens.surfaceContainer, borderRadius: '9999px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.max(2, (day.players / maxP) * 100)}%`, background: tokens.primary, borderRadius: '9999px', transition: 'width .6s cubic-bezier(.4,0,.2,1)' }} />
            </div>
            <div style={{ width: 36, fontSize: 12, fontWeight: 500, color: tokens.onSurface, flexShrink: 0 }}>
              {day.players}
            </div>
          </div>
        ))}
      </Card>
    </>
  );
}



// ── Helper: event emoji → Material Symbol ──
function eventIcon(emoji: string): string {
  const map: Record<string, string> = {
    '🏆': 'emoji_events',
    '💀': 'skull',
    '⚔️': 'swords',
    '💎': 'diamond',
    '🐉': 'pest_control',
    '🔥': 'local_fire_department',
    '🎯': 'gps_fixed',
    '⭐': 'star',
  };
  return map[emoji] || 'info';
}
