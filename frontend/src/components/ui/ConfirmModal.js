import React, { useEffect, useState } from 'react';
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      document.body.style.overflow = 'hidden';
    } else {
      const timer = setTimeout(() => setMounted(false), 300);
      document.body.style.overflow = 'unset';
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen && !mounted) return null;

  const color = variant === "danger" ? "#e11d48" : "var(--primary)";
  const bgColor = variant === "danger" ? "rgba(225, 29, 72, 0.1)" : "rgba(99, 102, 241, 0.1)";

  return (
    <div 
      className={`modal-backdrop ${isOpen ? 'active' : ''}`}
      style={{
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
        opacity: isOpen ? 1 : 0,
        backdropFilter: isOpen ? 'blur(10px)' : 'blur(0px)',
        transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        pointerEvents: isOpen ? 'auto' : 'none',
        padding: '1.5rem'
      }} 
      onClick={onClose}
    >
      <style jsx global>{`
        @keyframes confirmEntrance {
          0% { 
            opacity: 0; 
            transform: scale(0.85) translateY(20px);
            filter: blur(10px);
          }
          100% { 
            opacity: 1; 
            transform: scale(1) translateY(0);
            filter: blur(0px);
          }
        }
        
        .confirm-content {
          animation: confirmEntrance 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          background: var(--card) !important;
          border: 1px solid var(--glass-border) !important;
          box-shadow: 0 30px 60px -12px rgba(0, 0, 0, 0.3) !important;
          border-radius: 1.75rem !important;
          padding: 2.25rem;
          max-width: 440px;
          width: 100%;
          position: relative;
          transition: transform 0.3s var(--ease-out-quart);
        }

        .confirm-content.closing {
          animation: confirmExit 0.3s var(--ease-out-quart) forwards;
        }

        @keyframes confirmExit {
          from { opacity: 1; transform: scale(1) translateY(0); }
          to { opacity: 0; transform: scale(0.95) translateY(10px); }
        }
      `}</style>
      <div 
        className={`confirm-content ${!isOpen ? 'closing' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            background: 'var(--muted)',
            border: 'none',
            borderRadius: '0.75rem',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--muted-foreground)',
            transition: 'all 0.2s'
          }}
          className="hover-lift"
        >
          <X size={18} />
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
          <div style={{
            background: bgColor,
            width: '64px',
            height: '64px',
            borderRadius: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: color
          }}>
            <AlertTriangle size={32} />
          </div>
          <div>
            <h3 style={{ margin: '0 0 0.75rem 0', fontWeight: 900, fontSize: '1.5rem', letterSpacing: '-0.02em' }}>{title}</h3>
            <p style={{ margin: 0, color: 'var(--muted-foreground)', fontSize: '1rem', lineHeight: '1.6', fontWeight: 500 }}>
              {message}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            onClick={onClose}
            style={{
              flex: 1,
              padding: '0.875rem',
              borderRadius: '1rem',
              border: '1px solid var(--border)',
              background: 'transparent',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            className="input-hover"
          >
            {cancelText}
          </button>
          <button 
            onClick={() => {
              onConfirm();
              onClose();
            }}
            style={{
              flex: 1,
              padding: '0.875rem',
              borderRadius: '1rem',
              border: 'none',
              background: color,
              color: 'white',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: variant === "danger" ? '0 10px 15px -3px rgba(225, 29, 72, 0.3)' : 'var(--shadow-primary)'
            }}
            className="hover-lift"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
