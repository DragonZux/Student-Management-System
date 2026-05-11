"use client";
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Loader2, Eye, EyeOff, Terminal, Zap } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import CyberCard from '@/components/ui/CyberCard';
import CyberButton from '@/components/ui/CyberButton';
import CyberInput from '@/components/ui/CyberInput';
import CyberBadge from '@/components/ui/CyberBadge';
import styles from '@/styles/modules/auth/login.module.css';
import { hasMinLength, isValidEmail, popupValidationError } from '@/lib/validation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const normalizedEmail = email.trim();
    if (!isValidEmail(normalizedEmail)) {
      popupValidationError(setError, 'Email không hợp lệ. Vui lòng kiểm tra lại.');
      return;
    }
    if (!hasMinLength(password, 8)) {
      popupValidationError(setError, 'Mật khẩu phải có ít nhất 8 ký tự.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await login(normalizedEmail, password);
      if (!result.success) {
        setError(result.error);
        setIsSubmitting(false);
      }
    } catch (err) {
      setError('Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      {/* Cyberpunk Background Grid Pattern */}
      <div className={styles.gridPattern} />
      <div className={styles.scanlines} />
      
      {/* Neon glow accents */}
      <div className={styles.neonGlow} style={{ position: 'absolute', top: '10%', left: '5%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(0, 255, 136, 0.1) 0%, transparent 70%)', borderRadius: '50%' }} />
      <div className={styles.neonGlow} style={{ position: 'absolute', bottom: '10%', right: '5%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(255, 0, 255, 0.08) 0%, transparent 70%)', borderRadius: '50%' }} />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className={styles.cardWrap}
      >
        <CyberCard 
          variant="terminal"
          title="ACCESS CONTROL"
          style={{ width: '100%', maxWidth: '450px' }}
        >
          {/* Hero Section */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{ marginBottom: '2rem', textAlign: 'center' }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
              <Terminal size={48} color="#00ff88" strokeWidth={1.5} />
            </div>
            <h1 className={styles.title} style={{ 
              fontSize: '2rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: '#00ff88',
              textShadow: '0 0 15px rgba(0, 255, 136, 0.4)',
              margin: '0 0 1.5rem 0'
            }}>
              ACCESS CONTROL
            </h1>

          {/* Error Message */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -10 }} 
                style={{ 
                  marginBottom: '1.5rem',
                  padding: '1rem',
                  backgroundColor: 'rgba(255, 51, 102, 0.1)',
                  border: '1px solid #ff3366',
                  color: '#ff3366',
                  fontSize: '0.875rem',
                  fontFamily: '"Share Tech Mono", monospace',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}
              >
                ⚠ {error}
              </motion.div>
            )}
          </AnimatePresence>
          </motion.div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <CyberInput 
              id="email" 
              label="USER ID / EMAIL"
              type="email" 
              required 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="Enter email"
              autoComplete="email"
              error={false}
            />

            <div>
              <CyberInput 
                id="password" 
                label="ACCESS CODE"
                type={passwordVisible ? 'text' : 'password'} 
                required 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="Enter password"
                autoComplete="current-password"
                error={false}
                prefix={false}
              />
              <button 
                type="button" 
                onClick={() => setPasswordVisible(v => !v)} 
                style={{
                  marginTop: '0.5rem',
                  background: 'none',
                  border: 'none',
                  color: '#00ff88',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  fontFamily: '"Share Tech Mono", monospace',
                  padding: 0
                }}
              >
                {passwordVisible ? '[ HIDE ]' : '[ SHOW ]'}
              </button>
            </div>

            <CyberButton 
              variant="glitch" 
              size="lg"
              type="submit" 
              disabled={isSubmitting}
              style={{ marginTop: '1rem' }}
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                'GRANT ACCESS'
              )}
            </CyberButton>
          </form>

          {/* Status Badges */}
          <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <CyberBadge variant="success" size="sm">SYSTEM ONLINE</CyberBadge>
            <CyberBadge variant="accent" size="sm">ENCRYPTED</CyberBadge>
          </div>
        </CyberCard>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className={styles.footer}
          style={{
            textAlign: 'center',
            marginTop: '2rem',
            fontSize: '0.75rem',
            color: 'var(--muted-foreground)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}
        >
          © 2026 SMS ViệtHub • v1.0.0 • CYBERPUNK EDITION
        </motion.div>
      </motion.div>
    </div>
  );
}
