import React from 'react';
import { tokens, shape } from '../tokens';

interface CardProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export default function Card({ children, style }: CardProps) {
  return (
    <div
      style={{
        background: tokens.elevatedSurface,
        borderRadius: shape.extraLarge,
        padding: '24px',
        border: `1px solid ${tokens.outlineVariant}`,
        boxShadow: `0 1px 3px rgba(0,0,0,0.08)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
