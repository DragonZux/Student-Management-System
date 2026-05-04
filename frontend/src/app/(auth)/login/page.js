"use client";
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, Mail, Lock, ArrowRight, Loader2, ShieldCheck, Zap, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import InlineMessage from '@/components/ui/InlineMessage';
import Card from '@/components/ui/Card';
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
    const result = await login(normalizedEmail, password);
    if (!result.success) {
      setError(result.error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.loginContainer} style={{ background: 'var(--background)' }}>
      <div className={styles.backdropBubble} style={{ left: '-8%', top: '-8%', width: '58%', height: '58%', background: 'radial-gradient(circle, var(--primary) 0%, transparent 70%)' }} />
      <div className={styles.backdropBubble} style={{ right: '-8%', bottom: '-8%', width: '58%', height: '58%', background: 'radial-gradient(circle, var(--secondary) 0%, transparent 70%)' }} />

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className={styles.cardWrap}>
        <Card className="w-full" style={{ borderRadius: '1rem' }}>
          <div className={styles.hero}>
            <div className={styles.heroLogo} aria-hidden>
              <GraduationCap size={36} color="white" strokeWidth={2} />
            </div>
            <div className={styles.title}>SMS Việt <span>Hub</span></div>
            <div className={styles.subtitle}>Hệ thống Quản lý Đào tạo Thông minh</div>
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ marginBottom: 12 }}>
                <InlineMessage variant="error">{error}</InlineMessage>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className={styles.form} aria-describedby={error ? 'login-error' : undefined}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="email">Tài khoản Email</label>
              <div className={styles.inputWrap}>
                <input id="email" className={styles.input} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@university.edu.vn" autoComplete="email" />
                <div className={styles.inputIcon}><Mail size={16} /></div>
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="password">Mật khẩu</label>
              <div className={styles.inputWrap}>
                <input id="password" className={styles.input} type={passwordVisible ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" />
                <div className={styles.inputIcon}><Lock size={16} /></div>
                <button type="button" aria-label={passwordVisible ? 'Hide password' : 'Show password'} onClick={() => setPasswordVisible(v => !v)} className={styles.inputToggle}>
                  {passwordVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className={styles.optionsRow}>
              <label className={styles.remember}><input type="checkbox" aria-label="Ghi nhớ đăng nhập" /> Ghi nhớ</label>
              <button type="button" className={styles.forgot}>Quên mật khẩu?</button>
            </div>

            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} disabled={isSubmitting} type="submit" className={styles.submit} aria-disabled={isSubmitting}>
              {isSubmitting ? <Loader2 size={18} /> : 'Đăng nhập'} <ArrowRight size={16} />
            </motion.button>
          </form>

          <div className={styles.badges}>
            <div><ShieldCheck size={14} /> SSL</div>
            <div><Zap size={14} /> Nhanh</div>
          </div>
        </Card>

        <div className={styles.footer}>© 2026 SMS Hub. Đội ngũ Công nghệ</div>
      </motion.div>
    </div>
  );
}
