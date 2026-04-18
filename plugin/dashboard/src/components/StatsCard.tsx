import React, { useState } from 'react';
import '@m3e/shape';

// ──────────────────────────────────────────────────────────────
// StatsCard — exakt wie WeatherCard der Weather App
// Einzigartige borderRadius + M3 Expressive Shape Morphing
// ──────────────────────────────────────────────────────────────

interface StatsCardProps {
  icon: string;
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  cardRadius?: string;
  cardBg?: string;
  cardOnBg?: string;
  iconBg?: string;
  iconColor?: string;
  iconShape?: string;
  iconMorphTo?: string;
}

export default function StatsCard({
  icon,
  label,
  value,
  sub,
  cardRadius = '28px',
  cardBg = '#E8DEF8',
  cardOnBg = '#1D1B20',
  iconBg = '#6750A4',
  iconColor = '#FFFFFF',
  iconShape = 'circle',
  iconMorphTo,
}: StatsCardProps) {
  const [hovered, setHovered] = useState(false);
  const currentShape = hovered && iconMorphTo ? iconMorphTo : iconShape;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: cardBg,
        color: cardOnBg,
        borderRadius: cardRadius,
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        minWidth: 0,
        flex: '1 1 140px',
        cursor: 'default',
        transition: 'transform 200ms ease',
      }}
    >
      {/* @ts-ignore */}
      <m3e-shape
        name={currentShape}
        style={{
          '--m3e-shape-size': '48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: iconBg,
          transition: 'clip-path 450ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        } as React.CSSProperties}
      >
        <span
          className="material-symbols-outlined"
          style={{ fontSize: '24px', color: iconColor }}
        >
          {icon}
        </span>
        {/* @ts-ignore */}
      </m3e-shape>

      <div style={{ fontSize: '28px', fontWeight: 600, lineHeight: 1.1 }}>
        {value}
      </div>

      <div style={{ fontSize: '12px', opacity: 0.8, textAlign: 'center' }}>
        {label}
      </div>

      {sub && (
        <div style={{ fontSize: '11px', opacity: 0.6, textAlign: 'center' }}>
          {sub}
        </div>
      )}
    </div>
  );
}
