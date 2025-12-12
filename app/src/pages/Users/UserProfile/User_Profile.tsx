// src/pages/User/User_Profile.tsx
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../ProdCatalog/PC_Navigation/PC_Navbar';
import { useAuth } from '../../../contexts/AuthContext';
import styles from './User_Profile.module.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

type UserRole = 'admin' | 'customer';
type UserStatus = 'active' | 'inactive' | 'suspended';

interface UserProfile {
  id: number;                 // BIGSERIAL PK
  user_id: string;            // e.g. ADM-00001 / CST-00001
  first_name: string;
  last_name: string;
  email: string;
  username: string;
  role: UserRole;
  status: UserStatus;
  created_at: string;
  updated_at: string;
  last_login: string | null;
}

function formatDateTimePH(value: string | null | undefined) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function User_Profile() {
  const navigate = useNavigate();
  const { isLoggedIn, isLoading: authLoading } = useAuth();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const displayName = useMemo(() => {
    if (!user) return '—';
    return `${user.first_name} ${user.last_name}`.trim() || '—';
  }, [user]);

  const initials = useMemo(() => {
    if (!user) return 'U';
    const a = user.first_name?.charAt(0) || '';
    const b = user.last_name?.charAt(0) || '';
    return (a + b).toUpperCase() || 'U';
  }, [user]);

  useEffect(() => {
    if (authLoading) return;

    if (!isLoggedIn) {
      navigate('/login', { state: { backgroundLocation: { pathname: '/user/profile' } } });
      return;
    }

    const loadProfile = async () => {
      setLoading(true);
      setErrorMsg(null);

      try {
        const res = await fetch(`${API_BASE_URL}/api/user/profile`, {
          method: 'GET',
          credentials: 'include',
        });

        const data = await res.json();

        if (!res.ok || !data.success || !data.user) {
          setErrorMsg(data.message || 'Failed to load profile.');
          setUser(null);
          return;
        }

        setUser(data.user as UserProfile);
      } catch (err) {
        console.error('Error loading profile:', err);
        setErrorMsg('Failed to load profile. Please try again.');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [authLoading, isLoggedIn, navigate]);

  if (authLoading || loading) {
    return (
      <div className={styles.page}>
        <Navbar />
        <main className={styles.main}>
          <div className={styles.container}>
            <div className={styles.centerBox}>
              <div className={styles.spinner} />
              <p>Loading profile...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={styles.page}>
        <Navbar />
        <main className={styles.main}>
          <div className={styles.container}>
            {errorMsg && <div className={styles.alertError}>{errorMsg}</div>}
            <div className={styles.centerBox}>
              <h2 className={styles.subtitle}>Profile not available</h2>
              <p className={styles.textMuted}>Please try again.</p>
              <button
                type="button"
                className={styles.btnPrimary}
                onClick={() => window.location.reload()}
              >
                Reload
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Navbar />
      <main className={styles.main}>
        <div className={styles.container}>
          {errorMsg && <div className={styles.alertError}>{errorMsg}</div>}

          <div className={styles.header}>
            <div>
              <h1 className={styles.title}>My Profile</h1>
              <p className={styles.subtitleText}>View your account details.</p>
            </div>

            <div className={styles.headerActions}>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={() => navigate('/product-catalog')}
              >
                Back to catalog
              </button>
            </div>
          </div>

          <section className={styles.card}>
            <div className={styles.profileTop}>
              <div className={styles.avatar}>{initials}</div>
              <div className={styles.profileMeta}>
                <div className={styles.profileName}>{displayName}</div>
                <div className={styles.profileRole}>
                  {user.role} · {user.status}
                </div>
              </div>
            </div>

            <dl className={styles.detailsGrid}>
              <div className={styles.detailRow}>
                <dt>Account ID</dt>
                <dd>{user.user_id || '—'}</dd>
              </div>

              <div className={styles.detailRow}>
                <dt>Username</dt>
                <dd>{user.username || '—'}</dd>
              </div>

              <div className={styles.detailRow}>
                <dt>Email</dt>
                <dd>{user.email || '—'}</dd>
              </div>

              <div className={styles.detailRow}>
                <dt>Role</dt>
                <dd>{user.role}</dd>
              </div>

              <div className={styles.detailRow}>
                <dt>Status</dt>
                <dd>{user.status}</dd>
              </div>

              <div className={styles.detailRow}>
                <dt>Created</dt>
                <dd>{formatDateTimePH(user.created_at)}</dd>
              </div>

              <div className={styles.detailRow}>
                <dt>Last login</dt>
                <dd>{formatDateTimePH(user.last_login)}</dd>
              </div>
            </dl>
          </section>
        </div>
      </main>
    </div>
  );
}
