"use client";
import { useEffect, useState } from 'react';
import Card from '@/components/ui/Card';
import InlineMessage from '@/components/ui/InlineMessage';
import { Lock, Shield } from 'lucide-react';
import api from '@/lib/api';
import { hasMinLength, isValidEmail, popupValidationError } from '@/lib/validation';

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');
  const [profileError, setProfileError] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const [profileForm, setProfileForm] = useState({
    full_name: '',
    email: '',
    department: '',
  });

  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
  });

  useEffect(() => {
    let cancelled = false;
    async function loadProfile() {
      try {
        setLoading(true);
        setError('');
        const res = await api.get('/auth/me');
        if (cancelled) return;
        const data = res.data || null;
        setProfile(data);
        setProfileForm({
          full_name: data?.full_name || '',
          email: data?.email || '',
          department: data?.department || '',
        });
      } catch (e) {
        console.error('Failed to load profile', e);
        if (!cancelled) setError(e.response?.data?.detail || 'Không tải được thông tin hồ sơ');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadProfile();
    return () => {
      cancelled = true;
    };
  }, []);

  const saveProfile = async () => {
    const fullName = profileForm.full_name.trim();
    const email = profileForm.email.trim();
    if (!fullName) {
      popupValidationError(setProfileError, 'Vui lòng nhập họ và tên.');
      setProfileMessage('');
      return;
    }
    if (!isValidEmail(email)) {
      popupValidationError(setProfileError, 'Email không đúng định dạng.');
      setProfileMessage('');
      return;
    }

    try {
      setSaving(true);
      setProfileMessage('');
      setProfileError('');
      const payload = {
        full_name: fullName,
        email,
        department: profileForm.department.trim() || null,
      };
      const res = await api.patch('/auth/me', payload);
      const updated = res.data || profile;
      setProfile(updated);
      localStorage.setItem('user', JSON.stringify(updated));
      setProfileMessage('Cập nhật hồ sơ thành công.');
    } catch (e) {
      console.error('Update profile failed', e);
      setProfileError(e.response?.data?.detail || 'Cập nhật hồ sơ thất bại.');
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    if (!passwordForm.current_password || !passwordForm.new_password) {
      popupValidationError(setPasswordError, 'Vui lòng nhập đầy đủ mật khẩu hiện tại và mật khẩu mới.');
      setPasswordMessage('');
      return;
    }
    if (!hasMinLength(passwordForm.new_password, 8)) {
      popupValidationError(setPasswordError, 'Mật khẩu mới phải có ít nhất 8 ký tự.');
      setPasswordMessage('');
      return;
    }
    if (passwordForm.new_password === passwordForm.current_password) {
      popupValidationError(setPasswordError, 'Mật khẩu mới phải khác mật khẩu hiện tại.');
      setPasswordMessage('');
      return;
    }
    try {
      setPasswordLoading(true);
      setPasswordMessage('');
      setPasswordError('');
      await api.post('/auth/change-password', {
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      });
      setPasswordForm({ current_password: '', new_password: '' });
      setPasswordMessage('Đổi mật khẩu thành công.');
    } catch (e) {
      console.error('Change password failed', e);
      setPasswordError(e.response?.data?.detail || 'Đổi mật khẩu thất bại.');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="animate-in">
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ marginBottom: '0.5rem' }}>Hồ sơ & Bảo mật</h1>
        <p style={{ fontSize: '1.1rem' }}>Quản lý thông tin cá nhân và thiết lập an toàn cho tài khoản của bạn.</p>
      </div>

      <div className="grid grid-cols-1" style={{ gap: '2.5rem' }}>
        <Card title="Thông tin cá nhân" className="glass">
          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              <div className="animate-spin" style={{ display: 'inline-block', width: '2rem', height: '2rem', border: '3px solid var(--muted)', borderTopColor: 'var(--primary)', borderRadius: '50%' }} />
              <p style={{ marginTop: '1rem' }}>Đang tải thông tin hồ sơ...</p>
            </div>
          ) : null}
          
          <InlineMessage variant="error" style={{ marginBottom: '1rem' }}>{error}</InlineMessage>
          <InlineMessage variant="success" style={{ marginBottom: '1rem' }}>{profileMessage}</InlineMessage>
          <InlineMessage variant="error" style={{ marginBottom: '1rem' }}>{profileError}</InlineMessage>

          {!loading && !error ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem 2.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--muted-foreground)' }}>Họ và tên</label>
                  <input
                    value={profileForm.full_name}
                    onChange={(e) => setProfileForm((p) => ({ ...p, full_name: e.target.value }))}
                    placeholder="Nhập họ và tên đầy đủ"
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--muted-foreground)' }}>Email liên hệ</label>
                  <input
                    value={profileForm.email}
                    onChange={(e) => setProfileForm((p) => ({ ...p, email: e.target.value }))}
                    placeholder="email@example.com"
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--muted-foreground)' }}>Vai trò</label>
                  <div style={{ padding: '0.75rem 1rem', background: 'var(--muted)', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Shield size={18} color="var(--primary)" />
                    <span style={{ fontWeight: 700, textTransform: 'capitalize' }}>{profile?.role || 'Người dùng'}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--muted-foreground)' }}>Khoa / Bộ môn</label>
                  <input
                    value={profileForm.department}
                    readOnly
                    style={{ background: 'var(--muted)', cursor: 'not-allowed', opacity: 0.8 }}
                    title="Liên hệ Quản trị viên để thay đổi"
                  />
                  <p style={{ fontSize: '0.75rem', fontStyle: 'italic' }}>* Chỉ Admin mới có quyền thay đổi thông tin này.</p>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <button
                  onClick={saveProfile}
                  disabled={saving}
                  className="btn-primary"
                >
                  {saving ? 'Đang lưu...' : 'Lưu thay đổi hồ sơ'}
                </button>
              </div>
            </div>
          ) : null}
        </Card>

        <Card title="Bảo mật tài khoản" className="glass">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border)' }}>
              <div style={{ padding: '0.85rem', background: 'rgba(244, 63, 94, 0.1)', borderRadius: '1rem' }}>
                <Lock size={24} color="var(--accent)" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Thay đổi mật khẩu</h3>
                <p style={{ margin: 0, fontSize: '0.875rem' }}>Nên sử dụng mật khẩu mạnh để bảo vệ tài khoản.</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--muted-foreground)' }}>Mật khẩu hiện tại</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={passwordForm.current_password}
                  onChange={(e) => setPasswordForm((p) => ({ ...p, current_password: e.target.value }))}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--muted-foreground)' }}>Mật khẩu mới</label>
                <input
                  type="password"
                  placeholder="Tối thiểu 8 ký tự"
                  value={passwordForm.new_password}
                  onChange={(e) => setPasswordForm((p) => ({ ...p, new_password: e.target.value }))}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--muted-foreground)', fontSize: '0.875rem' }}>
                <Shield size={16} />
                <span>Mã hóa bảo mật 256-bit</span>
              </div>
              <button
                onClick={changePassword}
                disabled={passwordLoading}
                className="btn-primary"
                style={{ background: 'var(--foreground)' }}
              >
                {passwordLoading ? 'Đang xử lý...' : 'Cập nhật mật khẩu'}
              </button>
            </div>
            
            <InlineMessage variant="success">{passwordMessage}</InlineMessage>
            <InlineMessage variant="error">{passwordError}</InlineMessage>
          </div>
        </Card>
      </div>
    </div>
  );
}
