import { useEffect, useState } from 'react';
import Card from './Card';
import Chip from './Chip';
import { tokens } from '../tokens';
import type { StatsData } from '../data';
import { formatDuration } from '../data';

export default function StatusPage({ data }: { data: StatsData }) {
  const [health, setHealth] = useState<any>(null);

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
      if (mounted) {
        setHealth({
          ok: true,
          uptimeSeconds: 0,
          version: data.serverName || 'dev',
          database: 'unknown',
          centralApi: 'unknown',
          lastUpdated: new Date().toISOString(),
          plugins: [],
        });
      }
    };

    fetchHealth();
    const iv = setInterval(fetchHealth, 30_000);
    return () => { mounted = false; clearInterval(iv); };
  }, [data.serverName]);

  const statusOk = health?.ok ?? false;

  return (
    <Card style={{ marginBottom: '16px' }}>
      <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px', color: tokens.onSurface }}>
        Server Status
      </h2>

      {health ? (
        <div style={{ display: 'grid', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 10, height: 10, borderRadius: 6, background: statusOk ? '#4CAF50' : '#E53935' }} />
            <div style={{ fontWeight: 600 }}>{statusOk ? 'OK' : 'Problem'}</div>
            <div style={{ marginLeft: 'auto', color: tokens.outline, fontSize: 13 }}>{new Date(health.lastUpdated || Date.now()).toLocaleString()}</div>
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 200px' }}>
              <div style={{ fontSize: 12, color: tokens.outline }}>Version</div>
              <div style={{ fontWeight: 600 }}>{health.version || '—'}</div>
            </div>
            <div style={{ flex: '1 1 200px' }}>
              <div style={{ fontSize: 12, color: tokens.outline }}>Uptime</div>
              <div style={{ fontWeight: 600 }}>{formatDuration(health.uptimeSeconds || 0)}</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 6 }}>
            <div style={{ flex: '1 1 200px' }}>
              <div style={{ fontSize: 12, color: tokens.outline }}>Database</div>
              <div style={{ fontWeight: 600 }}>{health.database ?? '—'}</div>
            </div>
            <div style={{ flex: '1 1 200px' }}>
              <div style={{ fontSize: 12, color: tokens.outline }}>Central API</div>
              <div style={{ fontWeight: 600 }}>{health.centralApi ?? '—'}</div>
            </div>
          </div>

          {Array.isArray(health.plugins) && health.plugins.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 12, color: tokens.outline }}>Plugins</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
                {health.plugins.map((pname: string, i: number) => (
                  <Chip key={i} label={pname} icon="bolt" selected={false} color="secondary" onClick={() => {}} />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div style={{ color: tokens.outline }}>Lade Status…</div>
      )}
    </Card>
  );
}
