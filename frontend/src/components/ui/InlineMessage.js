import { AlertCircle, CheckCircle, Info, TriangleAlert } from 'lucide-react';

export default function InlineMessage({ variant = 'error', children, style }) {
  if (!children) return null;

  const config = {
    error: {
      bg: 'rgba(244, 63, 94, 0.05)',
      fg: '#e11d48',
      border: 'rgba(244, 63, 94, 0.2)',
      icon: <AlertCircle size={18} />,
    },
    success: {
      bg: 'rgba(16, 185, 129, 0.05)',
      fg: '#059669',
      border: 'rgba(16, 185, 129, 0.2)',
      icon: <CheckCircle size={18} />,
    },
    info: {
      bg: 'rgba(59, 130, 246, 0.05)',
      fg: '#2563eb',
      border: 'rgba(59, 130, 246, 0.2)',
      icon: <Info size={18} />,
    },
    warning: {
      bg: 'rgba(245, 158, 11, 0.05)',
      fg: '#d97706',
      border: 'rgba(245, 158, 11, 0.2)',
      icon: <TriangleAlert size={18} />,
    },
  };

  const tone = config[variant] || config.error;

  return (
    <div
      className="fade-in slide-down"
      style={{
        padding: '0.875rem 1rem',
        borderRadius: '0.85rem',
        border: `1px solid ${tone.border}`,
        background: tone.bg,
        color: tone.fg,
        fontSize: '0.9rem',
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        ...style,
      }}
    >
      <span style={{ flexShrink: 0, display: 'flex' }}>{tone.icon}</span>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
}
