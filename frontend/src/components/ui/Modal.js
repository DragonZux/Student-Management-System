import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

export default function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  maxWidth = '600px' 
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

  return (
    <div 
      className={`modal-backdrop ${isOpen ? 'active' : ''}`}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1.5rem',
        opacity: isOpen ? 1 : 0,
        backdropFilter: isOpen ? 'blur(10px)' : 'blur(0px)',
        transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        pointerEvents: isOpen ? 'auto' : 'none'
      }} 
      onClick={onClose}
    >
      <style jsx global>{`
        @keyframes modalEntrance {
          0% { 
            opacity: 0; 
            transform: scale(0.9) translateY(40px);
            filter: blur(10px);
          }
          100% { 
            opacity: 1; 
            transform: scale(1) translateY(0);
            filter: blur(0px);
          }
        }
        
        .modal-content {
          animation: modalEntrance 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          background: var(--card) !important;
          border: 1px solid var(--glass-border) !important;
          box-shadow: 0 30px 60px -12px rgba(0, 0, 0, 0.3) !important;
          border-radius: 2rem !important;
          position: relative;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          transition: transform 0.3s var(--ease-out-quart);
        }

        .modal-content.closing {
          animation: modalExit 0.3s var(--ease-out-quart) forwards;
        }

        @keyframes modalExit {
          from { opacity: 1; transform: scale(1) translateY(0); }
          to { opacity: 0; transform: scale(0.95) translateY(20px); }
        }
      `}</style>
      <div 
        className={`modal-content ${!isOpen ? 'closing' : ''}`}
        style={{
          maxWidth: maxWidth,
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ 
          padding: '1.75rem 2.5rem', 
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(255,255,255,0.02)',
          backdropFilter: 'blur(20px)',
          zIndex: 10
        }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.03em' }}>{title}</h2>
          <button 
            onClick={onClose}
            style={{
              background: 'var(--muted)',
              border: 'none',
              borderRadius: '1rem',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--muted-foreground)',
              transition: 'all 0.3s var(--ease-out-quart)'
            }}
            className="hover-lift"
          >
            <X size={22} />
          </button>
        </div>

        <div style={{ 
          padding: '2.5rem',
          overflowY: 'auto',
          flex: 1
        }}>
          {children}
        </div>
      </div>
    </div>
  );
}
