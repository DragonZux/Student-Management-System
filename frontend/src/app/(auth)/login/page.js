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
      {/* Background Decorations */}
      <div className={styles.backgroundPattern} />
      <div className={styles.backdropBubble} style={{ left: '-10%', top: '10%', width: '40vw', height: '40vw', background: 'radial-gradient(circle, var(--primary) 0%, transparent 70%)' }} />
      <div className={styles.backdropBubble} style={{ right: '-10%', bottom: '10%', width: '35vw', height: '35vw', background: 'radial-gradient(circle, var(--secondary) 0%, transparent 70%)' }} />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className={styles.cardWrap}
      >
        <Card className="glass w-full" style={{ padding: '2.5rem', border: '1px solid var(--glass-border)' }}>
          <div className={styles.hero}>
            <motion.div 
              initial={{ rotate: -20, scale: 0.5, opacity: 0 }}
              animate={{ rotate: -7, scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className={styles.heroLogo} 
              aria-hidden
            >
              <GraduationCap size={40} color="white" strokeWidth={2.5} />
            </motion.div>
            <h1 className={`${styles.title} text-gradient`}>
              SMS ViệtHub
            </h1>
            <p className={styles.subtitle}>Hệ thống Quản lý Đào tạo Thông minh & Toàn diện</p>
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -10 }} 
                style={{ marginBottom: 20 }}
              >
                <InlineMessage variant="error">{error}</InlineMessage>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="email">Email</label>
              <div className={styles.inputWrap}>
                <input 
                  id="email" 
                  className={styles.input} 
                  type="email" 
                  required 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder="name@university.edu.vn" 
                  autoComplete="email" 
                />
                <Mail className={styles.inputIcon} size={20} />
              </div>
            </div>

            <div className={styles.field}>
              <div className={styles.optionsRow} style={{ margin: 0, marginBottom: 4 }}>
                <label className={styles.label} htmlFor="password" style={{ margin: 0 }}>Mật khẩu</label>
                <button type="button" className={styles.forgot}>Quên mật khẩu?</button>
              </div>
              <div className={styles.inputWrap}>
                <input 
                  id="password" 
                  className={styles.input} 
                  type={passwordVisible ? 'text' : 'password'} 
                  required 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="••••••••" 
                  autoComplete="current-password" 
                />
                <Lock className={styles.inputIcon} size={20} />
                <button 
                  type="button" 
                  aria-label={passwordVisible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} 
                  onClick={() => setPasswordVisible(v => !v)} 
                  className={styles.inputToggle}
                >
                  {passwordVisible ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className={styles.optionsRow}>
              <label className={styles.remember}>
                <input type="checkbox" /> Ghi nhớ đăng nhập
              </label>
            </div>

            <motion.button 
              whileHover={{ scale: 1.01 }} 
              whileTap={{ scale: 0.98 }} 
              disabled={isSubmitting} 
              type="submit" 
              className={styles.submit}
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <span>Đăng nhập</span>
                  <ArrowRight size={20} />
                </>
              )}
            </motion.button>
          </form>

          <div className={styles.badges}>
            <div className={styles.badgeItem}><ShieldCheck size={16} color="var(--primary)" /> Bảo mật SSL</div>
            <div className={styles.badgeItem}><Zap size={16} color="var(--accent)" /> Tốc độ cao</div>
          </div>
        </Card>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className={styles.footer}
        >
          &copy; 2026 SMS ViệtHub. All rights reserved.
        </motion.div>
      </motion.div>
    </div>
  );
}
