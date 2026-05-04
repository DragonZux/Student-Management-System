"use client";
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, Mail, Lock, ArrowRight, Loader2, ShieldCheck, Zap } from 'lucide-react';
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
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#020617]">
      {/* Premium Background Mesh */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/20 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-violet-600/20 blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] rounded-full bg-emerald-600/10 blur-[100px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-lg p-4"
      >
        <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-10 md:p-16 shadow-2xl shadow-black/50">
          <div className="text-center mb-12">
            <motion.div 
              whileHover={{ rotate: 0, scale: 1.1 }}
              initial={{ rotate: -10, scale: 0.8 }}
              animate={{ rotate: -5, scale: 1 }}
              className="w-24 h-24 mx-auto mb-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-indigo-500/40"
            >
              <GraduationCap size={56} />
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4"
            >
              SMS Việt <span className="text-indigo-400">Hub</span>
            </motion.h1>
            <p className="text-slate-400 font-medium text-lg">Hệ thống Quản lý Đào tạo Thông minh</p>
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-8"
              >
                <InlineMessage variant="error">{error}</InlineMessage>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-3">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 ml-2">Tài khoản Email</label>
              <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                  <Mail size={22} />
                </div>
                <input 
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@university.edu.vn"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-14 pr-6 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white/10 transition-all text-lg"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 ml-2">Mật khẩu bảo mật</label>
              <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                  <Lock size={22} />
                </div>
                <input 
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-14 pr-6 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white/10 transition-all text-lg"
                />
              </div>
            </div>

            <div className="flex items-center justify-between px-2 text-sm">
              <label className="flex items-center gap-3 text-slate-400 cursor-pointer select-none">
                <input type="checkbox" className="w-5 h-5 rounded-md accent-indigo-500" />
                <span>Ghi nhớ phiên</span>
              </label>
              <button type="button" className="text-indigo-400 font-bold hover:text-indigo-300 transition-colors">Quên mật khẩu?</button>
            </div>

            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white py-5 rounded-2xl font-black text-xl shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-3 disabled:opacity-50 transition-all"
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin" size={28} />
              ) : (
                <>
                  Truy cập Hệ thống <ArrowRight size={28} />
                </>
              )}
            </motion.button>
          </form>

          <div className="mt-12 flex items-center justify-center gap-8 grayscale opacity-30">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} />
              <span className="text-[10px] font-bold uppercase tracking-widest text-white">SSL Encrypted</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap size={16} />
              <span className="text-[10px] font-bold uppercase tracking-widest text-white">Fast Response</span>
            </div>
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center mt-12 text-slate-500 text-sm font-medium"
        >
          © 2026 SMS Hub. Được phát triển bởi đội ngũ công nghệ cao. <br/>
          <button className="mt-2 text-indigo-400 hover:underline">Liên hệ quản trị viên</button>
        </motion.div>
      </motion.div>
    </div>
  );
}
