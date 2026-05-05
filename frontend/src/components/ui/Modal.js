import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

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

  const modalContent = (
    <>
      <style jsx global>{`
        @keyframes modalBackdropIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes modalBackdropOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }

        @keyframes modalContentIn {
          from { 
            opacity: 0;
            transform: scale(0.92) translateY(30px);
          }
          to { 
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        
        @keyframes modalContentOut {
          from {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
          to { 
            opacity: 0;
            transform: scale(0.92) translateY(30px);
          }
        }

        .modal-backdrop-wrapper {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: radial-gradient(circle at 30% 50%, rgba(99, 102, 241, 0.08) 0%, rgba(0, 0, 0, 0.4) 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          animation: ${isOpen ? 'modalBackdropIn' : 'modalBackdropOut'} 0.35s ease-out forwards;
        }

        .modal-content-wrapper {
          background: linear-gradient(135deg, var(--card) 0%, rgba(255, 255, 255, 0.97) 100%);
          border: 1px solid var(--glass-border);
          border-radius: 2rem;
          box-shadow: 0 20px 70px -10px rgba(0, 0, 0, 0.25),
                      0 0 0 1px rgba(99, 102, 241, 0.1) inset;
          display: flex;
          flex-direction: column;
          width: 90%;
          max-width: ${maxWidth};
          max-height: 90vh;
          animation: ${isOpen ? 'modalContentIn' : 'modalContentOut'} 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          overflow: hidden;
        }

        .modal-header {
          padding: 2rem 2.5rem;
          border-bottom: 1px solid var(--border);
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-shrink: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(99, 102, 241, 0.02) 100%);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }

        .modal-header h2 {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 900;
          letter-spacing: -0.03em;
          background: linear-gradient(135deg, var(--foreground) 0%, var(--primary) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          flex: 1;
        }

        .modal-close-btn {
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
          margin-left: 1rem;
        }

        .modal-close-btn:hover {
          background: var(--primary);
          color: white;
          transform: rotate(90deg) scale(1.1);
          box-shadow: 0 8px 20px rgba(99, 102, 241, 0.3);
        }

        .modal-body {
          padding: 2.5rem;
          overflow-y: auto;
          overflow-x: hidden;
          flex: 1;
          scroll-behavior: smooth;
        }

        /* Custom scrollbar */
        .modal-body::-webkit-scrollbar {
          width: 8px;
        }

        .modal-body::-webkit-scrollbar-track {
          background: transparent;
        }

        .modal-body::-webkit-scrollbar-thumb {
          background: var(--border);
          border-radius: 4px;
          transition: background 0.3s ease;
        }

        .modal-body::-webkit-scrollbar-thumb:hover {
          background: var(--muted-foreground);
        }

        /* Modal Form Styling */
        .modal-inner {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .modal-inner input,
        .modal-inner select,
        .modal-inner textarea {
          width: 100%;
          padding: 0.875rem 1.25rem;
          border: 1.5px solid var(--border);
          border-radius: 1.125rem;
          background: var(--input);
          font-size: 1rem;
          font-family: inherit;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          outline: none;
        }

        .modal-inner input:focus,
        .modal-inner select:focus,
        .modal-inner textarea:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.08),
                      inset 0 0 0 1px rgba(99, 102, 241, 0.2);
          background: rgba(99, 102, 241, 0.01);
        }

        .modal-inner label {
          display: block;
          font-size: 0.95rem;
          font-weight: 700;
          margin-bottom: 0.75rem;
          color: var(--foreground);
          letter-spacing: -0.01em;
        }

        /* Modal button styling */
        .modal-inner .btn-primary,
        .modal-inner .btn-secondary {
          padding: 0.95rem 2rem;
          border-radius: 1.125rem;
          font-weight: 700;
          font-size: 1rem;
          border: none;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          outline: none;
        }

        .modal-inner .btn-primary {
          background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
          color: white;
          box-shadow: 0 8px 20px rgba(99, 102, 241, 0.3);
        }

        .modal-inner .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 30px rgba(99, 102, 241, 0.4);
        }

        .modal-inner .btn-secondary {
          background: var(--surface-1);
          color: var(--foreground);
          border: 1.5px solid var(--border);
        }

        .modal-inner .btn-secondary:hover {
          background: var(--background);
          border-color: var(--primary);
          color: var(--primary);
        }
      `}</style>

      <div 
        className="modal-backdrop-wrapper"
        onClick={onClose}
      >
        <div 
          className="modal-content-wrapper"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-header">
            <h2>{title}</h2>
            <button 
              onClick={onClose}
              className="modal-close-btn"
              aria-label="Đóng modal"
            >
              <X size={22} />
            </button>
          </div>

          <div className="modal-body">
            {children}
          </div>
        </div>
      </div>
    </>
  );

  // Render to document body using portal to escape parent containers
  if (typeof window !== 'undefined' && document.body) {
    return createPortal(modalContent, document.body);
  }

  return null;
}
