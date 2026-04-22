import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Xác nhận hành động", 
  message = "Bạn có chắc chắn muốn thực hiện hành động này?", 
  confirmText = "Xác nhận", 
  cancelText = "Hủy",
  variant = "danger" 
}) {
  if (!isOpen) return null;

  const color = variant === "danger" ? "#991b1b" : "var(--primary)";
  const bgColor = variant === "danger" ? "#fef2f2" : "#eff6ff";

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      backdropFilter: 'blur(4px)'
    }} onClick={onClose}>
      <div 
        style={{
          background: 'var(--background)',
          padding: '2rem',
          borderRadius: 'var(--radius)',
          maxWidth: '400px',
          width: '90%',
          boxShadow: 'var(--shadow-xl)',
          position: 'relative',
          border: '1px solid var(--border)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--muted-foreground)'
          }}
        >
          <X size={20} />
        </button>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{
            background: bgColor,
            padding: '0.75rem',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: color
          }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <h3 style={{ margin: '0 0 0.5rem 0', fontWeight: 700 }}>{title}</h3>
            <p style={{ margin: 0, color: 'var(--muted-foreground)', fontSize: '0.875rem', lineHeight: '1.5' }}>
              {message}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button 
            onClick={onClose}
            style={{
              padding: '0.625rem 1.25rem',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              background: 'transparent',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {cancelText}
          </button>
          <button 
            onClick={() => {
              onConfirm();
              onClose();
            }}
            style={{
              padding: '0.625rem 1.25rem',
              borderRadius: '8px',
              border: 'none',
              background: color,
              color: 'white',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
