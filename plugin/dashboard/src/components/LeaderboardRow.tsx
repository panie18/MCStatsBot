import React from 'react';
import { tokens } from '../tokens';

interface LeaderboardRowProps {
  rank: number;
  avatar?: string;
  name: string;
  detail?: string;
  value: string;
  icon?: string;
}

export default function LeaderboardRow({
  rank,
  avatar,
  name,
  detail,
  value,
  icon,
}: LeaderboardRowProps) {
  const [hovered, setHovered] = React.useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '14px 20px',
        gap: '14px',
        transition: 'background 100ms ease',
        background: hovered ? tokens.surfaceContainer : 'transparent',
      }}
    >
      <div
        style={{
          width: 28,
          fontSize: rank >= 0 && rank < 3 ? 18 : 14,
          fontWeight: 600,
          color: tokens.primary,
          textAlign: 'center',
          flexShrink: 0,
        }}
      >
        {rank < 0 ? (
          icon ? (
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 20, color: tokens.primary }}
            >
              {icon}
            </span>
          ) : (
            ''
          )
        ) : rank === 0 ? (
          <span className="material-symbols-outlined" style={{ fontSize: 22, color: '#FFD700' }}>
            emoji_events
          </span>
        ) : rank === 1 ? (
          <span className="material-symbols-outlined" style={{ fontSize: 22, color: '#C0C0C0' }}>
            emoji_events
          </span>
        ) : rank === 2 ? (
          <span className="material-symbols-outlined" style={{ fontSize: 22, color: '#CD7F32' }}>
            emoji_events
          </span>
        ) : (
          `${rank + 1}.`
        )}
      </div>

      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: '9999px',
          background: tokens.surfaceContainerHigh,
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        {avatar && (
          <img
            src={avatar}
            alt={name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              imageRendering: 'pixelated',
            }}
          />
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: tokens.onSurface,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {name}
        </div>
        {detail && (
          <div style={{ fontSize: 12, color: tokens.outline, marginTop: 1 }}>
            {detail}
          </div>
        )}
      </div>

      <div style={{ fontSize: 16, fontWeight: 500, color: tokens.onSurface, flexShrink: 0 }}>
        {value}
      </div>
    </div>
  );
}
