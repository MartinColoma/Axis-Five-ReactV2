import React, { useEffect, useMemo, useState } from 'react';
import styles from './AdminArchivedUsers.module.css';

interface ArchivedUser {
  id: string;
  user_id: string;
  full_name: string;
  first_name: string;
  last_name: string;
  email: string;
  username: string;
  role: 'admin' | 'customer';
  status: 'active' | 'inactive' | 'suspended';
  created_at: string;
  archived_at: string;
  archived_by: string;
  archive_reason: string | null;
}

type SortColumn =
  | 'user_id'
  | 'full_name'
  | 'email'
  | 'role'
  | 'status'
  | 'created_at'
  | 'archived_at'
  | 'archived_by';
type SortDirection = 'asc' | 'desc';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

const AdminArchivedUsers: React.FC = () => {
  const [users, setUsers] = useState<ArchivedUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Restore Modal
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [userToRestore, setUserToRestore] = useState<ArchivedUser | null>(null);

  useEffect(() => {
    fetchArchivedUsers();
  }, []);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const fetchArchivedUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/dashboard/users-archived`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        setUsers(data.users || []);
      } else {
        showNotification('error', data.message || 'Failed to fetch archived users');
      }
    } catch (err) {
      console.error('Error fetching archived users:', err);
      showNotification('error', 'Failed to fetch archived users');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenRestoreModal = (user: ArchivedUser) => {
    setUserToRestore(user);
    setShowRestoreModal(true);
  };

  const handleConfirmRestore = async () => {
    if (!userToRestore) return;

    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/dashboard/users/restore/${userToRestore.user_id}`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        showNotification('success', 'User restored successfully!');
        setShowRestoreModal(false);
        setUserToRestore(null);
        fetchArchivedUsers();
      } else {
        showNotification('error', data.message || 'Failed to restore user');
      }
    } catch (err) {
      console.error('Error restoring user:', err);
      showNotification('error', 'Failed to restore user');
    } finally {
      setLoading(false);
    }
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
        user.username.toLowerCase().includes(search) ||
        user.role.toLowerCase().includes(search) ||
        (user.archived_by && user.archived_by.toLowerCase().includes(search))
      );
    });

    if (sortColumn) {
      filtered = [...filtered].sort((a, b) => {
        let aValue: any = a[sortColumn];
        let bValue: any = b[sortColumn];

        if (sortColumn === 'created_at' || sortColumn === 'archived_at') {
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

  const formatDateTime = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return `${date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })} ${date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  };

  const getSortIcon = (column: SortColumn) => {
    if (sortColumn !== column) return 'fa-sort';
    return sortDirection === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
  };

  return (
    <>
      {loading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingContent}>
            <i className="fas fa-spinner fa-spin" /> Loading...
          </div>
        </div>
      )}

      <section
        className={`${styles.tabPane} ${styles.active}`}
        aria-label="Archived users"
      >
        <div className={styles.tableControls}>
          <div className={styles.tableHeader}>
            <h5>
              <i className="fas fa-archive" /> Archived Users
            </h5>
            <span className={styles.userCount}>
              {filteredAndSortedUsers.length} Archived Users
            </span>
          </div>

          <div className={styles.searchBarWrapper}>
            <div className={styles.searchBar}>
              <i className="fas fa-search" />
              <input
                type="text"
                placeholder="Search by name, email, username, role, or archived by..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Search archived users"
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
                  Full Name{' '}
                  <i className={`fas ${getSortIcon('full_name')} ${styles.sortIcon}`} />
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
                <th onClick={() => handleSort('archived_at')}>
                  Archived At{' '}
                  <i className={`fas ${getSortIcon('archived_at')} ${styles.sortIcon}`} />
                </th>
                <th onClick={() => handleSort('archived_by')}>
                  Archived By{' '}
                  <i className={`fas ${getSortIcon('archived_by')} ${styles.sortIcon}`} />
                </th>
                <th>Reason</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedUsers.length === 0 ? (
                <tr className={styles.noResults}>
                  <td colSpan={9}>No archived users found</td>
                </tr>
              ) : (
                filteredAndSortedUsers.map((user) => (
                  <tr key={user.id}>
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
                    <td>{formatDateTime(user.archived_at)}</td>
                    <td>{user.archived_by || '-'}</td>
                    <td className={styles.reasonCell}>
                      {user.archive_reason || '-'}
                    </td>
                    <td>
                      <button
                        type="button"
                        className={`${styles.actionBtn} ${styles.restoreBtn}`}
                        onClick={() => handleOpenRestoreModal(user)}
                        title="Restore User"
                      >
                        <i className="fas fa-undo" /> Restore
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {searchTerm && filteredAndSortedUsers.length === 0 && (
          <div className={styles.noResultsMessage}>
            <i className="fas fa-search" />
            <p>No archived users found matching your search criteria.</p>
          </div>
        )}
      </section>

      {/* Restore Modal */}
      {showRestoreModal && userToRestore && (
        <div className={styles.modalOverlay} onClick={() => setShowRestoreModal(false)}>
          <div className={styles.modalDialog} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalContent}>
              <div className={styles.modalHeader}>
                <h5 className={styles.modalTitle}>
                  <i className="fas fa-undo" /> Restore User Account
                </h5>
                <button
                  type="button"
                  className={styles.btnClose}
                  onClick={() => setShowRestoreModal(false)}
                  aria-label="Close restore modal"
                >
                  <i className="fas fa-times" />
                </button>
              </div>
              <div className={styles.modalBody}>
                <p>Are you sure you want to restore this user account?</p>
                <div className={styles.userInfoBox}>
                  <strong>{userToRestore.full_name}</strong>
                  <p className={styles.textMuted}>
                    User ID: {userToRestore.user_id} · Username: {userToRestore.username}
                  </p>
                  <p className={styles.textMuted}>
                    Archived by {userToRestore.archived_by || 'Unknown'} on{' '}
                    {formatDateTime(userToRestore.archived_at)}
                  </p>
                  {userToRestore.archive_reason && (
                    <p className={styles.textMuted}>
                      Reason: {userToRestore.archive_reason}
                    </p>
                  )}
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => setShowRestoreModal(false)}
                >
                  <i className="fas fa-times" /> Cancel
                </button>
                <button
                  type="button"
                  className={styles.btnPrimary}
                  onClick={handleConfirmRestore}
                  disabled={loading}
                >
                  <i className="fas fa-undo" /> Restore User
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

export default AdminArchivedUsers;
