"use client";
import { useState } from 'react';
import { GraduationCap, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
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

  const primaryColor = '#6366f1';
  const secondaryColor = '#a855f7';

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: `radial-gradient(circle at 10% 20%, rgba(99, 102, 241, 0.1) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(168, 85, 247, 0.1) 0%, transparent 40%), #f8fafc`,
      padding: '2rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Dynamic Background Elements */}
      <div className="animate-in" style={{ position: 'absolute', top: '15%', left: '10%', width: '300px', height: '300px', background: primaryColor, filter: 'blur(120px)', borderRadius: '50%', opacity: 0.1, animationDuration: '3s' }} />
      <div className="animate-in" style={{ position: 'absolute', bottom: '15%', right: '10%', width: '350px', height: '350px', background: secondaryColor, filter: 'blur(120px)', borderRadius: '50%', opacity: 0.1, animationDuration: '4s' }} />

      <div className="glass animate-in" style={{ 
        width: '100%', 
        maxWidth: '480px', 
        padding: '4rem', 
        background: 'rgba(255, 255, 255, 0.4)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.1), inset 0 0 0 1px rgba(255, 255, 255, 0.5)',
        border: '1px solid rgba(255, 255, 255, 0.4)',
        borderRadius: '2.5rem'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <div style={{ 
            width: '80px', 
            height: '80px', 
            background: `linear-gradient(135deg, ${primaryColor} 0%, #4338ca 100%)`, 
            borderRadius: '1.5rem', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            margin: '0 auto 1.75rem',
            color: 'white',
            boxShadow: '0 20px 40px -10px rgba(99, 102, 241, 0.5)',
            transform: 'rotate(-5deg)'
          }}>
            <GraduationCap size={44} />
          </div>
          <h1 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.04em', background: `linear-gradient(135deg, #0f172a 0%, ${primaryColor} 100%)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Hệ thống SMS</h1>
          <p style={{ marginTop: '0.75rem', color: '#64748b', fontWeight: 600, fontSize: '1.05rem' }}>Đăng nhập để bắt đầu phiên học tập</p>
        </div>

        <InlineMessage variant="error" style={{ marginBottom: '2rem' }}>{error}</InlineMessage>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            <label style={{ fontSize: '0.8125rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b' }}>Email nội bộ</label>
            <div style={{ position: 'relative' }}>
              <Mail size={20} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="username@university.edu.vn" 
                style={{ 
                  width: '100%', 
                  padding: '1rem 1rem 1rem 3.25rem',
                  borderRadius: '1.25rem',
                  background: 'rgba(255,255,255,0.5)',
                  border: '1px solid #e2e8f0',
                  fontSize: '1rem',
                  transition: 'all 0.3s ease'
                }} 
                className="input-hover"
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            <label style={{ fontSize: '0.8125rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b' }}>Mật khẩu bảo mật</label>
            <div style={{ position: 'relative' }}>
              <Lock size={20} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••" 
                style={{ 
                  width: '100%', 
                  padding: '1rem 1rem 1rem 3.25rem',
                  borderRadius: '1.25rem',
                  background: 'rgba(255,255,255,0.5)',
                  border: '1px solid #e2e8f0',
                  fontSize: '1rem',
                  transition: 'all 0.3s ease'
                }} 
                className="input-hover"
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.875rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', fontWeight: 600 }}>
              <input type="checkbox" style={{ width: '1.125rem', height: '1.125rem', accentColor: primaryColor, borderRadius: '4px' }} />
              <span>Duy trì đăng nhập</span>
            </label>
            <a href="#" style={{ color: primaryColor, fontWeight: 800, textDecoration: 'none' }}>Quên mật khẩu?</a>
          </div>

          <button 
            type="submit"
            disabled={isSubmitting}
            className="btn-primary"
            style={{ 
              width: '100%', 
              padding: '1.125rem', 
              justifyContent: 'center',
              fontSize: '1.125rem',
              fontWeight: 800,
              marginTop: '0.5rem',
              borderRadius: '1.25rem',
              boxShadow: '0 15px 30px -5px rgba(99, 102, 241, 0.4)'
            }}
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={24} /> : 'Xác nhận Đăng nhập'}
            {!isSubmitting && <ArrowRight size={24} />}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '3rem', fontSize: '0.9375rem', color: '#64748b' }}>
          Hệ thống được bảo mật bởi phòng CNTT. <br/>
          <a href="#" style={{ color: primaryColor, fontWeight: 800, marginTop: '0.5rem', display: 'inline-block' }}>Liên hệ hỗ trợ kỹ thuật</a>
        </div>
      </div>
    </div>
  );
}
