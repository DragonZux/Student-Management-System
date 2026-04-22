"use client";
import { useState } from 'react';
import { GraduationCap, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthProvider';
import InlineMessage from '@/components/ui/InlineMessage';
import { hasMinLength, isValidEmail, popupValidationError } from '@/lib/validation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const normalizedEmail = email.trim();
    if (!isValidEmail(normalizedEmail)) {
      popupValidationError(setError, 'Email không đúng định dạng. Ví dụ: ten@truong.edu.vn');
      return;
    }
    if (!hasMinLength(password, 8)) {
      popupValidationError(setError, 'Mật khẩu phải có ít nhất 8 ký tự.');
      return;
    }

    setIsSubmitting(true);
    
    const result = await login(normalizedEmail, password);
    if (!result.success) {
      setError(result.error);
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'radial-gradient(at 0% 0%, rgba(99, 102, 241, 0.15) 0px, transparent 50%), radial-gradient(at 100% 0%, rgba(168, 85, 247, 0.15) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(244, 63, 94, 0.15) 0px, transparent 50%), radial-gradient(at 0% 100%, rgba(99, 102, 241, 0.15) 0px, transparent 50%), var(--background)',
      padding: '2rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Decorative blobs */}
      <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '40%', height: '40%', background: 'rgba(99, 102, 241, 0.05)', filter: 'blur(100px)', borderRadius: '50%' }} />
      <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '40%', height: '40%', background: 'rgba(168, 85, 247, 0.05)', filter: 'blur(100px)', borderRadius: '50%' }} />

      <div className="glass animate-in" style={{ 
        width: '100%', 
        maxWidth: '460px', 
        padding: '3.5rem', 
        background: 'var(--glass-bg)',
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid var(--glass-border)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{ 
            width: '72px', 
            height: '72px', 
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)', 
            borderRadius: '1.25rem', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
            color: 'white',
            boxShadow: 'var(--shadow-primary)'
          }}>
            <GraduationCap size={40} />
          </div>
          <h1 style={{ margin: 0, fontSize: '2.25rem', background: 'linear-gradient(135deg, var(--foreground) 0%, var(--primary) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 800 }}>Chào mừng bạn</h1>
          <p style={{ marginTop: '0.75rem', color: 'var(--muted-foreground)', fontWeight: 500 }}>Hệ thống quản lý sinh viên SMS Việt</p>
        </div>

        <InlineMessage variant="error" style={{ marginBottom: '1.5rem' }}>{error}</InlineMessage>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Địa chỉ email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ten@truong.edu.vn" 
                style={{ width: '100%', paddingLeft: '2.75rem' }} 
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Mật khẩu</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" 
                style={{ width: '100%', paddingLeft: '2.75rem' }} 
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.875rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}>
              <input type="checkbox" style={{ width: '1rem', height: '1rem', accentColor: 'var(--primary)' }} />
              <span>Ghi nhớ</span>
            </label>
            <a href="#" style={{ color: var(--primary), fontWeight: 700, textDecoration: 'none' }}>Quên mật khẩu?</a>
          </div>

          <button 
            type="submit"
            disabled={isSubmitting}
            className="btn-primary"
            style={{ 
              width: '100%', 
              padding: '1rem', 
              justifyContent: 'center',
              fontSize: '1.1rem',
              marginTop: '0.5rem'
            }}
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : 'Đăng nhập hệ thống'}
            {!isSubmitting && <ArrowRight size={20} />}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '2.5rem', fontSize: '0.9rem', color: 'var(--muted-foreground)' }}>
          Bạn gặp sự cố? <a href="#" style={{ color: 'var(--primary)', fontWeight: 700 }}>Hỗ trợ kỹ thuật</a>
        </p>
      </div>
    </div>
  );
}
