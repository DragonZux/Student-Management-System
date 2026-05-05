import React, { useEffect, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { createPortal } from 'react-dom';

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
  const gradientColor = variant === "danger" 
    ? "linear-gradient(135deg, #e11d48 0%, #f43f5e 100%)"
    : "linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)";

  const modalContent = (
    <>
      <style jsx global>{`
        @keyframes confirmBackdropIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes confirmBackdropOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }

        @keyframes confirmContentIn {
          from { 
            opacity: 0;
            transform: scale(0.88) translateY(40px);
          }
          to { 
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        
        @keyframes confirmContentOut {
          from {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
          to { 
            opacity: 0;
            transform: scale(0.88) translateY(40px);
          }
        }

        .confirm-backdrop-wrapper {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: radial-gradient(circle at 50% 50%, rgba(225, 29, 72, 0.08) 0%, rgba(0, 0, 0, 0.45) 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          animation: ${isOpen ? 'confirmBackdropIn' : 'confirmBackdropOut'} 0.35s ease-out forwards;
        }

        .confirm-content-wrapper {
          background: linear-gradient(135deg, var(--card) 0%, rgba(255, 255, 255, 0.97) 100%);
          border: 1px solid var(--glass-border);
          border-radius: 2rem;
          box-shadow: 0 20px 70px -10px rgba(0, 0, 0, 0.25),
                      0 0 0 1px ${variant === "danger" ? "rgba(225, 29, 72, 0.1)" : "rgba(99, 102, 241, 0.1)"} inset;
          padding: 2.5rem;
          max-width: 480px;
          width: 90%;
          position: relative;
          display: flex;
          flex-direction: column;
          animation: ${isOpen ? 'confirmContentIn' : 'confirmContentOut'} 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        .confirm-close-btn {
          position: absolute;
          top: 1.5rem;
          right: 1.5rem;
          background: var(--muted);
          border: none;
          border-radius: 1rem;
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: var(--muted-foreground);
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          flex-shrink: 0;
        }

        .confirm-close-btn:hover {
          background: var(--border);
          color: var(--foreground);
          transform: rotate(90deg) scale(1.1);
        }

        .confirm-icon {
          width: 72px;
          height: 72px;
          border-radius: 1.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          background: ${bgColor};
          color: ${color};
          margin: 0 auto 1.5rem;
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        .confirm-content-wrapper h3 {
          margin: 0 0 0.75rem 0;
          font-weight: 900;
          font-size: 1.5rem;
          letter-spacing: -0.02em;
          text-align: center;
          color: var(--foreground);
        }

        .confirm-content-wrapper p {
          margin: 0 0 2.5rem 0;
          color: var(--muted-foreground);
          font-size: 1rem;
          line-height: 1.6;
          font-weight: 500;
          text-align: center;
        }

        .confirm-actions {
          display: flex;
          gap: 1rem;
        }

        .confirm-btn-cancel {
          flex: 1;
          padding: 1rem;
          border-radius: 1.125rem;
          border: 1.5px solid var(--border);
          background: var(--surface-1);
          color: var(--foreground);
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          font-size: 1rem;
          outline: none;
        }

        .confirm-btn-cancel:hover {
          background: var(--background);
          border-color: var(--primary);
          color: var(--primary);
          transform: translateY(-2px);
        }

        .confirm-btn-danger {
          flex: 1;
          padding: 1rem;
          border-radius: 1.125rem;
          border: none;
          background: ${gradientColor};
          color: white;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          font-size: 1rem;
          outline: none;
          box-shadow: 0 10px 30px ${variant === "danger" ? "rgba(225, 29, 72, 0.3)" : "rgba(99, 102, 241, 0.3)"};
        }

        .confirm-btn-danger:hover {
          transform: translateY(-2px);
          box-shadow: 0 15px 40px ${variant === "danger" ? "rgba(225, 29, 72, 0.4)" : "rgba(99, 102, 241, 0.4)"};
        }

        .confirm-btn-danger:active {
          transform: translateY(0);
        }
      `}</style>

      <div 
        className="confirm-backdrop-wrapper"
        onClick={onClose}
      >
        <div 
          className="confirm-content-wrapper"
          onClick={(e) => e.stopPropagation()}
        >
          <button 
            onClick={onClose}
            className="confirm-close-btn"
            aria-label="Đóng modal"
          >
            <X size={22} />
          </button>

          <div className="confirm-icon">
            <AlertTriangle size={40} />
          </div>

          <h3>{title}</h3>
          <p>{message}</p>

          <div className="confirm-actions">
            <button 
              onClick={onClose}
              className="confirm-btn-cancel"
            >
              {cancelText}
            </button>
            <button 
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="confirm-btn-danger"
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </>
  );

  // Render to document body using portal
  if (typeof window !== 'undefined' && document.body) {
    return createPortal(modalContent, document.body);
  }

  return null;
}
