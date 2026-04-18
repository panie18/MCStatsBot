
import { tokens, shape } from '../tokens';

type ChipColor = 'primary' | 'secondary' | 'tertiary' | 'error';

interface ChipProps {
  label: string;
  icon?: string;
  selected?: boolean;
  color?: ChipColor;
  onClick?: () => void;
}

const colorMap: Record<ChipColor, { bg: string; fg: string }> = {
  primary: { bg: tokens.primaryContainer, fg: tokens.onPrimaryContainer },
  secondary: { bg: tokens.secondaryContainer, fg: tokens.onSecondaryContainer },
  tertiary: { bg: tokens.tertiaryContainer, fg: tokens.onTertiaryContainer },
  error: { bg: tokens.errorContainer, fg: tokens.onErrorContainer },
};

export default function Chip({
  label,
  icon,
  selected = false,
  color = 'primary',
  onClick,
}: ChipProps) {
  const c = colorMap[color];

  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        background: selected ? c.bg : 'transparent',
        color: selected ? c.fg : tokens.onSurface,
        border: `1px solid ${selected ? 'transparent' : tokens.outline}`,
        borderRadius: shape.small,
        padding: '6px 16px',
        fontSize: '14px',
        fontWeight: 500,
        cursor: 'pointer',
        fontFamily: 'inherit',
        transition: 'all 200ms ease',
        whiteSpace: 'nowrap',
      }}
    >
      {icon && (
        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
          {icon}
        </span>
      )}
      {label}
    </button>
  );
}
