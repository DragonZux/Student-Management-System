export default function InlineMessage({ variant = 'error', children, style }) {
  if (!children) return null;

  const palette = {
    error: {
      bg: '#fee2e2',
      fg: '#991b1b',
      border: '#fecaca',
    },
    success: {
      bg: '#dcfce7',
      fg: '#166534',
      border: '#86efac',
    },
    info: {
      bg: '#dbeafe',
      fg: '#1d4ed8',
      border: '#93c5fd',
    },
    warning: {
      bg: '#ffedd5',
      fg: '#9a3412',
      border: '#fdba74',
    },
  };

  const tone = palette[variant] || palette.error;

  return (
    <div
      style={{
        padding: '0.75rem 0.875rem',
        borderRadius: '8px',
        border: `1px solid ${tone.border}`,
        background: tone.bg,
        color: tone.fg,
        fontSize: '0.875rem',
        fontWeight: 500,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
