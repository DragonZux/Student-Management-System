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
      background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
      padding: '2rem'
    }}>
      <div className="glass" style={{ 
        width: '100%', 
        maxWidth: '440px', 
        padding: '3rem', 
        borderRadius: '1.5rem',
        background: 'rgba(255, 255, 255, 0.9)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ 
            width: '64px', 
            height: '64px', 
            background: 'var(--primary)', 
            borderRadius: '1rem', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            margin: '0 auto 1rem',
            color: 'white'
          }}>
            <GraduationCap size={36} />
          </div>
          <h1 style={{ margin: 0, fontSize: '1.75rem', color: '#0f172a' }}>Chào mừng trở lại</h1>
          <p style={{ marginTop: '0.5rem' }}>Vui lòng nhập thông tin để đăng nhập</p>
        </div>

        <InlineMessage variant="error" style={{ marginBottom: '1.5rem', textAlign: 'center' }}>{error}</InlineMessage>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Địa chỉ email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ten@truong.edu.vn" 
                style={{ 
                  width: '100%', 
                  padding: '0.75rem 1rem 0.75rem 2.75rem', 
                  borderRadius: 'var(--radius)', 
                  border: '1px solid var(--border)',
                  background: 'white'
                }} 
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Mật khẩu</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" 
                style={{ 
                  width: '100%', 
                  padding: '0.75rem 1rem 0.75rem 2.75rem', 
                  borderRadius: 'var(--radius)', 
                  border: '1px solid var(--border)',
                  background: 'white'
                }} 
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8125rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input type="checkbox" style={{ accentColor: 'var(--primary)' }} />
              <span>Ghi nhớ đăng nhập</span>
            </label>
            <a href="#" style={{ color: 'var(--primary)', fontWeight: 600 }}>Quên mật khẩu?</a>
          </div>

          <button 
            type="submit"
            disabled={isSubmitting}
            style={{ 
              background: 'var(--primary)', 
              color: 'white', 
              padding: '0.875rem', 
              borderRadius: 'var(--radius)', 
              textAlign: 'center',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              marginTop: '0.5rem',
              boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.3)',
              border: 'none',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              opacity: isSubmitting ? 0.7 : 1
            }}
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : 'Đăng nhập'}
            {!isSubmitting && <ArrowRight size={18} />}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.875rem' }}>
          Chưa có tài khoản? <a href="#" style={{ color: 'var(--primary)', fontWeight: 600 }}>Liên hệ quản trị viên</a>
        </p>
      </div>
    </div>
  );
}
