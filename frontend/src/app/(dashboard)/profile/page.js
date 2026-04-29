import styles from '@/styles/modules/profile.module.css';
import { User, ShieldCheck } from 'lucide-react';

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
    <div className={`${styles.container} animate-in`}>
      <header className={`${styles.header} slide-right stagger-1`}>
        <h1>Thiết lập Tài khoản</h1>
        <p>Quản lý thông tin cá nhân và cài đặt bảo mật nâng cao.</p>
      </header>

      <div className={styles.sectionGrid}>
        <section className={`${styles.profileCard} slide-right stagger-2`}>
          <div className={styles.cardHeader}>
            <div className={styles.iconBox}>
              <User size={32} />
            </div>
            <div className={styles.cardTitle}>Thông tin cá nhân</div>
          </div>

          {loading ? (
            <div style={{ padding: '4rem', textAlign: 'center' }}>
              <div className="spinner" style={{ margin: '0 auto 1.5rem' }} />
              <p style={{ fontWeight: 600, color: 'var(--muted-foreground)' }}>Đang đồng bộ dữ liệu hồ sơ...</p>
            </div>
          ) : (
            <div className="animate-in">
              {error && <InlineMessage variant="error" style={{ marginBottom: '2rem' }}>{error}</InlineMessage>}
              {profileMessage && <InlineMessage variant="success" style={{ marginBottom: '2rem' }}>{profileMessage}</InlineMessage>}
              {profileError && <InlineMessage variant="error" style={{ marginBottom: '2rem' }}>{profileError}</InlineMessage>}

              <div className={styles.formGrid}>
                <div className={styles.formField}>
                  <label>Họ và tên đầy đủ</label>
                  <input
                    className={styles.input}
                    value={profileForm.full_name}
                    onChange={(e) => setProfileForm((p) => ({ ...p, full_name: e.target.value }))}
                    placeholder="Nhập họ và tên"
                  />
                </div>
                <div className={styles.formField}>
                  <label>Địa chỉ Email liên hệ</label>
                  <input
                    className={styles.input}
                    value={profileForm.email}
                    onChange={(e) => setProfileForm((p) => ({ ...p, email: e.target.value }))}
                    placeholder="email@example.com"
                  />
                </div>
                <div className={styles.formField}>
                  <label>Vai trò hệ thống</label>
                  <div className={styles.readOnlyField}>
                    <Shield size={18} color="var(--primary)" />
                    <span style={{ textTransform: 'uppercase' }}>{profile?.role || 'Người dùng'}</span>
                  </div>
                </div>
                <div className={styles.formField}>
                  <label>Khoa / Đơn vị công tác</label>
                  <div className={styles.readOnlyField} style={{ opacity: 0.8 }}>
                    <span>{profileForm.department || 'Chưa cập nhật'}</span>
                  </div>
                  <p style={{ fontSize: '0.75rem', fontStyle: 'italic', marginTop: '0.25rem', color: 'var(--muted-foreground)' }}>
                    * Vui lòng liên hệ Quản trị viên để thay đổi thông tin này.
                  </p>
                </div>
              </div>

              <div className={styles.actions}>
                <button
                  onClick={saveProfile}
                  disabled={saving}
                  className="btn-primary"
                  style={{ padding: '1rem 2.5rem', borderRadius: '1.25rem' }}
                >
                  {saving ? 'Đang lưu hồ sơ...' : 'Cập nhật thông tin'}
                </button>
              </div>
            </div>
          )}
        </section>

        <section className={`${styles.profileCard} slide-right stagger-3`}>
          <div className={styles.cardHeader}>
            <div className={styles.iconBox} style={{ color: 'var(--accent)', background: 'rgba(244, 63, 94, 0.05)' }}>
              <Lock size={32} />
            </div>
            <div className={styles.cardTitle}>An ninh & Mật khẩu</div>
          </div>

          <div className={styles.passwordSection}>
            {passwordMessage && <InlineMessage variant="success" style={{ marginBottom: '2rem' }}>{passwordMessage}</InlineMessage>}
            {passwordError && <InlineMessage variant="error" style={{ marginBottom: '2rem' }}>{passwordError}</InlineMessage>}

            <div className={styles.formGrid}>
              <div className={styles.formField}>
                <label>Mật khẩu hiện tại</label>
                <input
                  className={styles.input}
                  type="password"
                  placeholder="••••••••"
                  value={passwordForm.current_password}
                  onChange={(e) => setPasswordForm((p) => ({ ...p, current_password: e.target.value }))}
                />
              </div>
              <div className={styles.formField}>
                <label>Mật khẩu mới</label>
                <input
                  className={styles.input}
                  type="password"
                  placeholder="Tối thiểu 8 ký tự"
                  value={passwordForm.new_password}
                  onChange={(e) => setPasswordForm((p) => ({ ...p, new_password: e.target.value }))}
                />
              </div>
            </div>

            <div className={styles.passwordFooter}>
              <div className={styles.securityNote}>
                <ShieldCheck size={20} color="#059669" />
                <span>Tài khoản của bạn đang được bảo vệ bởi mã hóa AES-256</span>
              </div>
              <button
                onClick={changePassword}
                disabled={passwordLoading}
                className="btn-primary"
                style={{ background: 'var(--foreground)', color: 'var(--background)', padding: '1rem 2.5rem', borderRadius: '1.25rem' }}
              >
                {passwordLoading ? 'Đang xác thực...' : 'Đổi mật khẩu ngay'}
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
