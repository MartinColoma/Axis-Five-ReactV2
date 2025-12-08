import React, { useState } from 'react';
import styles from './CreateAcc.module.css';

interface FormData {
  role: string;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
}

const API_BASE_URL = import.meta.env.VITE_API_LOCAL_SERVER as string;

const AdminCreateAcc: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    role: '',
    username: '',
    first_name: '',
    last_name: '',
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.first_name ||
      !formData.last_name ||
      !formData.email ||
      !formData.username ||
      !formData.password ||
      !formData.role
    ) {
      showNotification('error', 'All fields are required!');
      return;
    }

    if (formData.password.length < 6) {
      showNotification('error', 'Password must be at least 6 characters!');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          username: formData.username,
          password: formData.password,
          role: formData.role,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setFormData({
          role: '',
          username: '',
          first_name: '',
          last_name: '',
          email: '',
          password: '',
        });
        showNotification('success', 'User account created successfully!');
      } else {
        showNotification('error', data.message || 'Failed to create user');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      showNotification('error', 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      role: '',
      username: '',
      first_name: '',
      last_name: '',
      email: '',
      password: '',
    });
  };

return (
  <>
    {loading && (
      <div className={styles.loadingOverlay}>
        <div className={styles.loadingContent}>
          <i className="fas fa-spinner fa-spin" /> Creating user...
        </div>
      </div>
    )}

    <section className={`${styles.tabPane} ${styles.active}`} aria-label="Create user account">
      <div className={styles.formHeader}>
        <h5>
          <i className="fas fa-user-plus" /> Register New User Account
        </h5>
      </div>

      {/* Two-column layout: form left, preview right */}
      <div className={styles.formLayout}>
        {/* Left: form */}
        <div className={styles.formColumn}>
          <form onSubmit={handleCreateUser} className={styles.userForm}>
            <div className={styles.formRow}>
              <div className={styles.colMd6}>
                <label className={styles.formLabel} htmlFor="first_name">
                  First Name:
                </label>
                <input
                  id="first_name"
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  className={styles.formControl}
                  placeholder="Enter first name"
                  required
                />
              </div>

              <div className={styles.colMd6}>
                <label className={styles.formLabel} htmlFor="last_name">
                  Last Name:
                </label>
                <input
                  id="last_name"
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  className={styles.formControl}
                  placeholder="Enter last name"
                  required
                />
              </div>
              <div className={styles.colMd6}>
                <label className={styles.formLabel} htmlFor="role">
                  Role / Membership Type:
                </label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className={styles.formControl}
                  required
                >
                  <option value="">Select Role</option>
                  <option value="customer">Customer</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <div className={styles.colMd6}>
                <label className={styles.formLabel} htmlFor="username">
                  Username:
                </label>
                <input
                  id="username"
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className={styles.formControl}
                  placeholder="Enter username"
                  required
                />
              </div>

              <div className={styles.colMd6}>
                <label className={styles.formLabel} htmlFor="email">
                  Email Address:
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={styles.formControl}
                  placeholder="Enter email address"
                  required
                />
              </div>

              <div className={styles.colMd6}>
                <label className={styles.formLabel} htmlFor="password">
                  Password:
                </label>
                <div className={styles.passwordInputWrapper}>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={styles.formControl}
                    placeholder="Enter password (min. 6 characters)"
                    required
                  />
                  <button
                    type="button"
                    className={styles.passwordToggleBtn}
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`} />
                  </button>
                </div>
              </div>

              <div className={styles.col12}>
                <div className={styles.formActions}>
                  <button
                    type="button"
                    className={styles.btnSecondary}
                    onClick={handleReset}
                    disabled={loading}
                  >
                    <i className="fas fa-redo" /> Clear All Fields
                  </button>
                  <button
                    type="submit"
                    className={styles.btnPrimary}
                    disabled={loading}
                  >
                    <i className="fas fa-user-check" /> Create User Account
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Right: preview */}
        <aside className={styles.previewColumn} aria-label="Account preview">
          <div className={styles.accountPreviewPanel}>
            <div className={styles.previewHeader}>
              <h5>
                <i className="fas fa-eye" /> Account Preview
              </h5>
            </div>
            <div className={styles.previewContent}>
              <div className={styles.previewItem}>
                <label>Full Name:</label>
                <span
                  className={`${styles.previewValue} ${
                    formData.first_name || formData.last_name ? styles.hasValue : ''
                  }`}
                >
                  {formData.first_name || formData.last_name
                    ? `${formData.first_name} ${formData.last_name}`.trim()
                    : '[[First Name]] + [[Last Name]]'}
                </span>
              </div>

              <div className={styles.previewItem}>
                <label>Username:</label>
                <span
                  className={`${styles.previewValue} ${
                    formData.username ? styles.hasValue : ''
                  }`}
                >
                  {formData.username || '-'}
                </span>
              </div>

              <div className={styles.previewItem}>
                <label>Email Address:</label>
                <span
                  className={`${styles.previewValue} ${
                    formData.email ? styles.hasValue : ''
                  }`}
                >
                  {formData.email || '-'}
                </span>
              </div>

              <div className={styles.previewItem}>
                <label>Role:</label>
                <span
                  className={`${styles.previewValue} ${styles.roleBadge} ${
                    formData.role
                      ? styles[
                          `role${
                            formData.role.charAt(0).toUpperCase() + formData.role.slice(1)
                          }` as 'roleAdmin' | 'roleCustomer'
                        ]
                      : ''
                  } ${formData.role ? styles.hasValue : ''}`}
                >
                  {formData.role
                    ? formData.role.charAt(0).toUpperCase() + formData.role.slice(1)
                    : '-'}
                </span>
              </div>

              <div className={styles.previewItem}>
                <label>Password:</label>
                <span
                  className={`${styles.previewValue} ${styles.passwordPreview} ${
                    formData.password ? styles.hasValue : ''
                  }`}
                >
                  {formData.password
                    ? '•'.repeat(Math.min(formData.password.length, 12))
                    : '••••••'}
                </span>
              </div>

              <div className={styles.previewNote}>
                <i className="fas fa-info-circle" />
                <small>
                  This is a live preview of the account being created. All information will be
                  validated before submission.
                </small>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </section>

    {notification && (
      <div
        className={`${styles.notification} ${
          styles[
            `notification${
              notification.type.charAt(0).toUpperCase() + notification.type.slice(1)
            }` as 'notificationSuccess' | 'notificationError'
          ]
        } ${styles.show}`}
      >
        <i
          className={`fas ${
            notification.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'
          }`}
        />
        <span>{notification.message}</span>
        <button
          type="button"
          className={styles.notificationClose}
          onClick={() => setNotification(null)}
          aria-label="Close notification"
        >
          <i className="fas fa-times" />
        </button>
      </div>
    )}
  </>
);

};

export default AdminCreateAcc;
