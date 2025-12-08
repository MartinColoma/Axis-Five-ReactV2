import React, { useMemo, useState, useEffect } from 'react';
import styles from './Overview.module.css';

interface User {
  user_id: string;
  full_name: string;
  first_name?: string;
  last_name?: string;
  email: string;
  username?: string;
  role: 'admin' | 'customer';
  status: 'active' | 'inactive' | 'suspended';
  created_at: string;
}

type SortColumn = 'user_id' | 'full_name' | 'email' | 'role' | 'status' | 'created_at';
type SortDirection = 'asc' | 'desc';

const API_BASE_URL = import.meta.env.VITE_API_LOCAL_SERVER as string;

const AdminOverview: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Edit Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [editFormData, setEditFormData] = useState({
    user_id: '',
    first_name: '',
    last_name: '',
    email: '',
    username: '',
    role: 'customer' as 'admin' | 'customer',
    status: 'active' as 'active' | 'inactive' | 'suspended',
    password: '',
  });

  // Delete Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        setUsers(data.users);
      } else {
        showNotification('error', data.message || 'Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      showNotification('error', 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (userId: string) => {
    const user = users.find((u) => u.user_id === userId);
    if (!user) return;

    setEditFormData({
      user_id: user.user_id,
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      email: user.email,
      username: user.username || '',
      role: user.role,
      status: user.status,
      password: '',
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editFormData.first_name || !editFormData.last_name || !editFormData.email || !editFormData.username) {
      showNotification('error', 'All fields except password are required!');
      return;
    }

    if (editFormData.password && editFormData.password.length < 6) {
      showNotification('error', 'Password must be at least 6 characters!');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/users/${editFormData.user_id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          first_name: editFormData.first_name,
          last_name: editFormData.last_name,
          email: editFormData.email,
          username: editFormData.username,
          role: editFormData.role,
          status: editFormData.status,
          password: editFormData.password || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setShowEditModal(false);
        showNotification('success', 'User updated successfully!');
        fetchUsers();
      } else {
        showNotification('error', data.message || 'Failed to update user');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      showNotification('error', 'Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (userId: string, userName: string) => {
    setUserToDelete({ id: userId, name: userName });
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/users/${userToDelete.id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: 'Deleted by administrator',
        }),
      });

      const data = await response.json();

      if (data.success) {
        showNotification('success', 'User archived successfully!');
        setShowDeleteModal(false);
        setUserToDelete(null);
        fetchUsers();
      } else {
        showNotification('error', data.message || 'Failed to archive user');
      }
    } catch (error) {
      console.error('Error archiving user:', error);
      showNotification('error', 'Failed to archive user');
    } finally {
      setLoading(false);
    }
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const filteredAndSortedUsers = useMemo(() => {
    const search = searchTerm.toLowerCase();

    let filtered = users.filter((user) => {
      return (
        user.full_name.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search) ||
        user.role.toLowerCase().includes(search)
      );
    });

    if (sortColumn) {
      filtered = [...filtered].sort((a, b) => {
        let aValue: any = a[sortColumn];
        let bValue: any = b[sortColumn];

        if (sortColumn === 'created_at') {
          aValue = new Date(aValue).getTime();
          bValue = new Date(bValue).getTime();
        }

        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [users, searchTerm, sortColumn, sortDirection]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getSortIcon = (column: SortColumn) => {
    if (sortColumn !== column) return 'fa-sort';
    return sortDirection === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
  };

  return (
    <>
      <section className={`${styles.tabPane} ${styles.active}`} aria-label="All users">
      <div className={styles.tableControls}>
        <div className={styles.tableHeader}>
          <h5>
            <i className="fas fa-users" /> All Users
          </h5>
          <span className={styles.userCount}>{filteredAndSortedUsers.length} Total Users</span>
        </div>

        <div className={styles.searchBarWrapper}>
          <div className={styles.searchBar}>
            <i className="fas fa-search" />
            <input
              type="text"
              placeholder="Search by name, email, or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search users"
            />
            {searchTerm && (
              <button
                type="button"
                className={styles.clearSearch}
                onClick={() => setSearchTerm('')}
                aria-label="Clear search"
              >
                <i className="fas fa-times" />
              </button>
            )}
          </div>
        </div>
      </div>

        <div className={styles.tableResponsive}>
          <table className={styles.usersTable}>
            <thead>
              <tr>
                <th onClick={() => handleSort('user_id')}>
                  User ID <i className={`fas ${getSortIcon('user_id')} ${styles.sortIcon}`} />
                </th>
                <th onClick={() => handleSort('full_name')}>
                  Full Name <i className={`fas ${getSortIcon('full_name')} ${styles.sortIcon}`} />
                </th>
                <th onClick={() => handleSort('email')}>
                  Email <i className={`fas ${getSortIcon('email')} ${styles.sortIcon}`} />
                </th>
                <th onClick={() => handleSort('role')}>
                  Role <i className={`fas ${getSortIcon('role')} ${styles.sortIcon}`} />
                </th>
                <th onClick={() => handleSort('status')}>
                  Status <i className={`fas ${getSortIcon('status')} ${styles.sortIcon}`} />
                </th>
                <th onClick={() => handleSort('created_at')}>
                  Created At <i className={`fas ${getSortIcon('created_at')} ${styles.sortIcon}`} />
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedUsers.length === 0 ? (
                <tr className={styles.noResults}>
                  <td colSpan={7}>No users found</td>
                </tr>
              ) : (
                filteredAndSortedUsers.map((user) => (
                  <tr key={user.user_id}>
                    <td>
                      <span className={styles.userIdBadge}>{user.user_id}</span>
                    </td>
                    <td>{user.full_name}</td>
                    <td>{user.email}</td>
                    <td>
                      <span
                        className={`${styles.roleBadge} ${
                          styles[
                            `role${
                              user.role.charAt(0).toUpperCase() + user.role.slice(1)
                            }` as 'roleAdmin' | 'roleCustomer'
                          ]
                        }`}
                      >
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`${styles.statusBadge} ${
                          styles[
                            `status${
                              user.status.charAt(0).toUpperCase() + user.status.slice(1)
                            }` as 'statusActive' | 'statusInactive' | 'statusSuspended'
                          ]
                        }`}
                      >
                        {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                      </span>
                    </td>
                    <td>{formatDate(user.created_at)}</td>
                    <td>
                      <button
                        type="button"
                        className={`${styles.actionBtn} ${styles.editBtn}`}
                        onClick={() => handleEditUser(user.user_id)}
                        title="Edit User"
                      >
                        <i className="fas fa-edit" />
                      </button>
                      <button
                        type="button"
                        className={`${styles.actionBtn} ${styles.deleteBtn}`}
                        onClick={() => handleDeleteClick(user.user_id, user.full_name)}
                        title="Delete User"
                      >
                        <i className="fas fa-trash" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {showEditModal && (
        <div className={styles.modalOverlay} onClick={() => setShowEditModal(false)}>
          <div className={styles.modalDialog} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalContent}>
              <div className={styles.modalHeader}>
                <h5 className={styles.modalTitle}>
                  <i className="fas fa-user-edit" /> Edit User Account
                </h5>
                <button
                  type="button"
                  className={styles.btnClose}
                  onClick={() => setShowEditModal(false)}
                  aria-label="Close edit modal"
                >
                  <i className="fas fa-times" />
                </button>
              </div>
              <div className={styles.modalBody}>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSaveEdit();
                  }}
                >
                  <div className={styles.formRow}>
                    <div className={styles.colMd6}>
                      <label className={styles.formLabel}>First Name:</label>
                      <input
                        type="text"
                        name="first_name"
                        value={editFormData.first_name}
                        onChange={handleEditInputChange}
                        className={styles.formControl}
                        required
                      />
                    </div>
                    <div className={styles.colMd6}>
                      <label className={styles.formLabel}>Last Name:</label>
                      <input
                        type="text"
                        name="last_name"
                        value={editFormData.last_name}
                        onChange={handleEditInputChange}
                        className={styles.formControl}
                        required
                      />
                    </div>
                    <div className={styles.colMd6}>
                      <label className={styles.formLabel}>Email Address:</label>
                      <input
                        type="email"
                        name="email"
                        value={editFormData.email}
                        onChange={handleEditInputChange}
                        className={styles.formControl}
                        required
                      />
                    </div>
                    <div className={styles.colMd6}>
                      <label className={styles.formLabel}>Username:</label>
                      <input
                        type="text"
                        name="username"
                        value={editFormData.username}
                        onChange={handleEditInputChange}
                        className={styles.formControl}
                        required
                      />
                    </div>
                    <div className={styles.colMd6}>
                      <label className={styles.formLabel}>Role:</label>
                      <select
                        name="role"
                        value={editFormData.role}
                        onChange={handleEditInputChange}
                        className={styles.formControl}
                        required
                      >
                        <option value="customer">Customer</option>
                        <option value="admin">Administrator</option>
                      </select>
                    </div>
                    <div className={styles.colMd6}>
                      <label className={styles.formLabel}>Status:</label>
                      <select
                        name="status"
                        value={editFormData.status}
                        onChange={handleEditInputChange}
                        className={styles.formControl}
                        required
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="suspended">Suspended</option>
                      </select>
                    </div>
                    <div className={styles.col12}>
                      <label className={styles.formLabel}>
                        New Password (leave blank to keep current):
                      </label>
                      <div className={styles.passwordInputWrapper}>
                        <input
                          type={showEditPassword ? 'text' : 'password'}
                          name="password"
                          value={editFormData.password}
                          onChange={handleEditInputChange}
                          className={styles.formControl}
                          placeholder="Enter new password (optional)"
                        />
                        <button
                          type="button"
                          className={styles.passwordToggleBtn}
                          onClick={() => setShowEditPassword((prev) => !prev)}
                          aria-label="Toggle password visibility"
                        >
                          <i className={`fas ${showEditPassword ? 'fa-eye-slash' : 'fa-eye'}`} />
                        </button>
                      </div>
                      <small className={styles.textMuted}>
                        Leave blank if you do not want to change the password.
                      </small>
                    </div>
                  </div>
                  <div className={styles.modalFooter}>
                    <button
                      type="button"
                      className={styles.btnSecondary}
                      onClick={() => setShowEditModal(false)}
                    >
                      <i className="fas fa-times" /> Cancel
                    </button>
                    <button
                      type="submit"
                      className={styles.btnPrimary}
                      disabled={loading}
                    >
                      <i className="fas fa-save" /> Save Changes
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className={styles.modalOverlay} onClick={() => setShowDeleteModal(false)}>
          <div className={styles.modalDialog} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalContent}>
              <div className={styles.modalHeader}>
                <h5 className={`${styles.modalTitle} ${styles.dangerTitle}`}>
                  <i className="fas fa-exclamation-triangle" /> Confirm Deletion
                </h5>
                <button
                  type="button"
                  className={styles.btnClose}
                  onClick={() => setShowDeleteModal(false)}
                  aria-label="Close delete modal"
                >
                  <i className="fas fa-times" />
                </button>
              </div>
              <div className={styles.modalBody}>
                <p>Are you sure you want to archive this user account?</p>
                <div className={styles.userInfoBox}>
                  <strong>{userToDelete?.name}</strong>
                  <p className={styles.textMuted}>
                    This will move the user to the archive. The user can be restored later if needed.
                  </p>
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => setShowDeleteModal(false)}
                >
                  <i className="fas fa-times" /> Cancel
                </button>
                <button
                  type="button"
                  className={styles.btnDanger}
                  onClick={handleConfirmDelete}
                  disabled={loading}
                >
                  <i className="fas fa-trash" /> Archive User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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

export default AdminOverview;
