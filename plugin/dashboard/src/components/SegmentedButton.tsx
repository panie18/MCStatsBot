
import { tokens, shape } from '../tokens';

interface SegmentedButtonProps {
  options: string[];
  selected: string;
  onSelect: (option: string) => void;
}

export default function SegmentedButton({
  options,
  selected,
  onSelect,
}: SegmentedButtonProps) {
  return (
    <div
      style={{
        display: 'inline-flex',
        border: `1px solid ${tokens.outline}`,
        borderRadius: shape.full,
        overflow: 'hidden',
      }}
    >
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onSelect(opt)}
          style={{
            padding: '8px 20px',
            fontSize: '14px',
            fontWeight: 500,
            fontFamily: 'inherit',
            border: 'none',
            cursor: 'pointer',
            background: opt === selected
              ? tokens.secondaryContainer
              : 'transparent',
            color: opt === selected
              ? tokens.onSecondaryContainer
              : tokens.onSurface,
            transition: 'all 200ms ease',
            borderRight: `1px solid ${tokens.outline}`,
          }}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}
