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
    <div>
      <h1>Hồ sơ & Bảo mật</h1>

      <div className="grid grid-cols-1" style={{ marginTop: '2rem' }}>
        <Card title="Thông tin cá nhân" className="glass">
          {loading ? <div style={{ padding: '1rem' }}>Đang tải...</div> : null}
          <InlineMessage variant="error" style={{ marginBottom: '0.75rem' }}>{error}</InlineMessage>
          <InlineMessage variant="success" style={{ marginBottom: '0.75rem' }}>{profileMessage}</InlineMessage>
          <InlineMessage variant="error" style={{ marginBottom: '0.75rem' }}>{profileError}</InlineMessage>

          {!loading && !error ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem 2rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>Họ và tên</label>
                  <input
                    value={profileForm.full_name}
                    onChange={(e) => setProfileForm((p) => ({ ...p, full_name: e.target.value }))}
                    style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid var(--border)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>Email</label>
                  <input
                    value={profileForm.email}
                    onChange={(e) => setProfileForm((p) => ({ ...p, email: e.target.value }))}
                    style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid var(--border)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>Vai trò</label>
                  <div style={{ fontWeight: 600 }}>{profile?.role || 'n/a'}</div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>Mã người dùng</label>
                  <div style={{ fontWeight: 600 }}>{profile?._id || profile?.id || 'n/a'}</div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>Khoa/Bộ môn</label>
                  <input
                    value={profileForm.department}
                    onChange={(e) => setProfileForm((p) => ({ ...p, department: e.target.value }))}
                    style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid var(--border)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>Trạng thái tài khoản</label>
                  <div style={{ fontWeight: 600 }}>{profile?.is_active ? 'Đang hoạt động' : 'Đã khóa'}</div>
                </div>
              </div>

              <button
                onClick={saveProfile}
                disabled={saving}
                style={{
                  marginTop: '2rem',
                  padding: '0.625rem 1.25rem',
                  borderRadius: 'var(--radius)',
                  border: '1px solid var(--border)',
                  background: saving ? 'var(--muted)' : 'transparent',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                }}
              >
                {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </>
          ) : null}
        </Card>

        <Card title="Bảo mật" className="glass" style={{ marginTop: '2rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ padding: '0.5rem', background: 'var(--muted)', borderRadius: '50%' }}>
                <Lock size={18} />
              </div>
              <div style={{ fontWeight: 600 }}>Đổi mật khẩu</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <input
                type="password"
                placeholder="Mật khẩu hiện tại"
                value={passwordForm.current_password}
                onChange={(e) => setPasswordForm((p) => ({ ...p, current_password: e.target.value }))}
                style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid var(--border)' }}
              />
              <input
                type="password"
                placeholder="Mật khẩu mới (tối thiểu 8 ký tự)"
                value={passwordForm.new_password}
                onChange={(e) => setPasswordForm((p) => ({ ...p, new_password: e.target.value }))}
                style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid var(--border)' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--muted-foreground)', fontSize: '0.875rem' }}>
                <Shield size={16} />
                Tài khoản được bảo vệ bằng đăng nhập token.
              </div>
              <button
                onClick={changePassword}
                disabled={passwordLoading}
                style={{
                  color: 'white',
                  background: 'var(--primary)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.6rem 1rem',
                  fontWeight: 600,
                  cursor: passwordLoading ? 'not-allowed' : 'pointer',
                  opacity: passwordLoading ? 0.8 : 1,
                }}
              >
                {passwordLoading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
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
