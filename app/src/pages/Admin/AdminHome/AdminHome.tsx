import { useState, useEffect, useMemo } from 'react';
import styles from './AdminHome.module.css';

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
type ActiveTab = 'overview' | 'create-account';

const AdminHome = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [showPassword, setShowPassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);
  
  // Modals
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState({
    role: '',
    username: '',
    first_name: '',
    last_name: '',
    email: '',
    password: ''
  });
  
  const [editFormData, setEditFormData] = useState({
    user_id: '',
    first_name: '',
    last_name: '',
    email: '',
    username: '',
    role: 'customer' as 'admin' | 'customer',
    status: 'active' as 'active' | 'inactive' | 'suspended',
    password: ''
  });
  
  const [userToDelete, setUserToDelete] = useState<{ id: string; name: string } | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Mock data - replace with actual API calls
  useEffect(() => {
    // Simulate fetching users
    const mockUsers: User[] = [
      {
        user_id: 'ADM-00001',
        full_name: 'John Doe',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        username: 'johndoe',
        role: 'admin',
        status: 'active',
        created_at: '2025-01-15T10:30:00Z'
      },
      {
        user_id: 'CST-00001',
        full_name: 'Jane Smith',
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane.smith@example.com',
        username: 'janesmith',
        role: 'customer',
        status: 'active',
        created_at: '2025-01-20T14:20:00Z'
      }
    ];
    setUsers(mockUsers);
  }, []);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.first_name || !formData.last_name || !formData.email || !formData.username || !formData.password) {
      showNotification('error', 'All fields are required!');
      return;
    }
    
    if (formData.password.length < 6) {
      showNotification('error', 'Password must be at least 6 characters!');
      return;
    }

    // Mock API call
    const newUser: User = {
      user_id: formData.role === 'admin' ? `ADM-${String(users.length + 1).padStart(5, '0')}` : `CST-${String(users.length + 1).padStart(5, '0')}`,
      full_name: `${formData.first_name} ${formData.last_name}`,
      first_name: formData.first_name,
      last_name: formData.last_name,
      email: formData.email,
      username: formData.username,
      role: formData.role as 'admin' | 'customer',
      status: 'active',
      created_at: new Date().toISOString()
    };

    setUsers([newUser, ...users]);
    setFormData({ role: '', username: '', first_name: '', last_name: '', email: '', password: '' });
    showNotification('success', 'User account created successfully!');
  };

  const handleEditUser = (userId: string) => {
    const user = users.find(u => u.user_id === userId);
    if (user) {
      setEditFormData({
        user_id: user.user_id,
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email,
        username: user.username || '',
        role: user.role,
        status: user.status,
        password: ''
      });
      setShowEditModal(true);
    }
  };

  const handleSaveEdit = () => {
    if (!editFormData.first_name || !editFormData.last_name || !editFormData.email || !editFormData.username) {
      showNotification('error', 'All fields except password are required!');
      return;
    }

    if (editFormData.password && editFormData.password.length < 6) {
      showNotification('error', 'Password must be at least 6 characters!');
      return;
    }

    // Mock API call
    setUsers(users.map(user => 
      user.user_id === editFormData.user_id 
        ? {
            ...user,
            first_name: editFormData.first_name,
            last_name: editFormData.last_name,
            full_name: `${editFormData.first_name} ${editFormData.last_name}`,
            email: editFormData.email,
            username: editFormData.username,
            role: editFormData.role,
            status: editFormData.status
          }
        : user
    ));

    setShowEditModal(false);
    showNotification('success', 'User updated successfully!');
  };

  const handleDeleteClick = (userId: string, userName: string) => {
    setUserToDelete({ id: userId, name: userName });
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (userToDelete) {
      setUsers(users.filter(u => u.user_id !== userToDelete.id));
      showNotification('success', 'User deleted successfully!');
      setShowDeleteModal(false);
      setUserToDelete(null);
    }
  };

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const filteredAndSortedUsers = useMemo(() => {
    let filtered = users.filter(user => {
      const search = searchTerm.toLowerCase();
      return (
        user.full_name.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search) ||
        user.role.toLowerCase().includes(search)
      );
    });

    if (sortColumn) {
      filtered.sort((a, b) => {
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
    <div className={styles.adminContainer}>
      {/* Navbar */}
      <nav className={styles.navbar}>
        <div className={styles.container}>
          <a href="#" className={styles.navbarBrand}>
            <h1>
              <span className={styles.axis}>Axis</span>
              <span className={styles.five}>Five Admin</span>
            </h1>
          </a>
          <div className={styles.navbarNav}>
            <span className={styles.navLink}>
              <i className="fas fa-user-shield"></i>
              Welcome, Admin
            </span>
            <a href="#" className={styles.logoutBtn}>
              <i className="fas fa-sign-out-alt"></i>Logout
            </a>
          </div>
        </div>
      </nav>

      {/* Dashboard Section */}
      <section className={styles.sectionPadding}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Administrator Dashboard</h2>

          {/* Quick Actions Panel */}
          <div className={styles.quickActionsPanel}>
            <div className={styles.tabHeader}>
              <h4 className={styles.panelTitle}>Quick Actions</h4>
              <div className={styles.tabButtons}>
                <button
                  className={`${styles.tabBtn} ${activeTab === 'overview' ? styles.active : ''}`}
                  onClick={() => setActiveTab('overview')}
                >
                  <i className="fas fa-chart-bar"></i>Overview
                </button>
                <button
                  className={`${styles.tabBtn} ${activeTab === 'create-account' ? styles.active : ''}`}
                  onClick={() => setActiveTab('create-account')}
                >
                  <i className="fas fa-user-plus"></i>Create New Account
                </button>
              </div>
            </div>

            <div className={styles.tabContentWrapper}>
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className={`${styles.tabPane} ${styles.active}`}>
                  <div className={styles.tableControls}>
                    <div className={styles.tableHeader}>
                      <h5><i className="fas fa-users"></i>All Users</h5>
                      <span className={styles.userCount}>{filteredAndSortedUsers.length} Total Users</span>
                    </div>

                    <div className={styles.searchBarWrapper}>
                      <div className={styles.searchBar}>
                        <i className="fas fa-search"></i>
                        <input
                          type="text"
                          placeholder="Search by name, email, or role..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                          <button className={styles.clearSearch} onClick={() => setSearchTerm('')}>
                            <i className="fas fa-times"></i>
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
                            User ID <i className={`fas ${getSortIcon('user_id')} ${styles.sortIcon}`}></i>
                          </th>
                          <th onClick={() => handleSort('full_name')}>
                            Full Name <i className={`fas ${getSortIcon('full_name')} ${styles.sortIcon}`}></i>
                          </th>
                          <th onClick={() => handleSort('email')}>
                            Email <i className={`fas ${getSortIcon('email')} ${styles.sortIcon}`}></i>
                          </th>
                          <th onClick={() => handleSort('role')}>
                            Role <i className={`fas ${getSortIcon('role')} ${styles.sortIcon}`}></i>
                          </th>
                          <th onClick={() => handleSort('status')}>
                            Status <i className={`fas ${getSortIcon('status')} ${styles.sortIcon}`}></i>
                          </th>
                          <th onClick={() => handleSort('created_at')}>
                            Created At <i className={`fas ${getSortIcon('created_at')} ${styles.sortIcon}`}></i>
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
                          filteredAndSortedUsers.map(user => (
                            <tr key={user.user_id}>
                              <td>
                                <span className={styles.userIdBadge}>{user.user_id}</span>
                              </td>
                              <td>{user.full_name}</td>
                              <td>{user.email}</td>
                              <td>
                                <span className={`${styles.roleBadge} ${styles[`role${user.role.charAt(0).toUpperCase() + user.role.slice(1)}`]}`}>
                                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                </span>
                              </td>
                              <td>
                                <span className={`${styles.statusBadge} ${styles[`status${user.status.charAt(0).toUpperCase() + user.status.slice(1)}`]}`}>
                                  {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                                </span>
                              </td>
                              <td>{formatDate(user.created_at)}</td>
                              <td>
                                <button
                                  className={`${styles.actionBtn} ${styles.editBtn}`}
                                  onClick={() => handleEditUser(user.user_id)}
                                  title="Edit User"
                                >
                                  <i className="fas fa-edit"></i>
                                </button>
                                <button
                                  className={`${styles.actionBtn} ${styles.deleteBtn}`}
                                  onClick={() => handleDeleteClick(user.user_id, user.full_name)}
                                  title="Delete User"
                                >
                                  <i className="fas fa-trash"></i>
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
                      <i className="fas fa-search"></i>
                      <p>No users found matching your search criteria.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Create Account Tab */}
              {activeTab === 'create-account' && (
                <div className={`${styles.tabPane} ${styles.active}`}>
                  <div className={styles.formHeader}>
                    <h5><i className="fas fa-user-plus"></i>Register New User Account</h5>
                  </div>

                  <div className={styles.row}>
                    <div className={styles.colLg7}>
                      <form onSubmit={handleCreateUser} className={styles.userForm}>
                        <div className={styles.formRow}>
                          <div className={styles.colMd6}>
                            <label className={styles.formLabel}>Role / Membership Type:</label>
                            <select
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
                            <label className={styles.formLabel}>Username:</label>
                            <input
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
                            <label className={styles.formLabel}>First Name:</label>
                            <input
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
                            <label className={styles.formLabel}>Last Name:</label>
                            <input
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
                            <label className={styles.formLabel}>Email Address:</label>
                            <input
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
                            <label className={styles.formLabel}>Password:</label>
                            <div className={styles.passwordInputWrapper}>
                              <input
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
                                onClick={() => setShowPassword(!showPassword)}
                              >
                                <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                              </button>
                            </div>
                          </div>

                          <div className={styles.col12}>
                            <div className={styles.formActions}>
                              <button type="reset" className={styles.btnSecondary}>
                                <i className="fas fa-redo"></i>Clear All Fields
                              </button>
                              <button type="submit" className={styles.btnPrimary}>
                                <i className="fas fa-user-check"></i>Create User Account
                              </button>
                            </div>
                          </div>
                        </div>
                      </form>
                    </div>

                    <div className={styles.colLg5}>
                      <div className={styles.accountPreviewPanel}>
                        <div className={styles.previewHeader}>
                          <h5><i className="fas fa-eye"></i>Account Preview</h5>
                        </div>
                        <div className={styles.previewContent}>
                          <div className={styles.previewItem}>
                            <label>Full Name:</label>
                            <span className={`${styles.previewValue} ${formData.first_name || formData.last_name ? styles.hasValue : ''}`}>
                              {formData.first_name || formData.last_name 
                                ? `${formData.first_name} ${formData.last_name}`.trim() 
                                : '[[First Name]] + [[Last Name]]'}
                            </span>
                          </div>

                          <div className={styles.previewItem}>
                            <label>Username:</label>
                            <span className={`${styles.previewValue} ${formData.username ? styles.hasValue : ''}`}>
                              {formData.username || '-'}
                            </span>
                          </div>

                          <div className={styles.previewItem}>
                            <label>Email Address:</label>
                            <span className={`${styles.previewValue} ${formData.email ? styles.hasValue : ''}`}>
                              {formData.email || '-'}
                            </span>
                          </div>

                          <div className={styles.previewItem}>
                            <label>Role:</label>
                            <span className={`${styles.previewValue} ${styles.roleBadge} ${formData.role ? styles[`role${formData.role.charAt(0).toUpperCase() + formData.role.slice(1)}`] : ''} ${formData.role ? styles.hasValue : ''}`}>
                              {formData.role ? formData.role.charAt(0).toUpperCase() + formData.role.slice(1) : '-'}
                            </span>
                          </div>

                          <div className={styles.previewItem}>
                            <label>Password:</label>
                            <span className={`${styles.previewValue} ${styles.passwordPreview} ${formData.password ? styles.hasValue : ''}`}>
                              {formData.password ? '•'.repeat(Math.min(formData.password.length, 12)) : '••••••'}
                            </span>
                          </div>

                          <div className={styles.previewNote}>
                            <i className="fas fa-info-circle"></i>
                            <small>This is a live preview of the account being created. All information will be validated before submission.</small>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Edit Modal */}
      {showEditModal && (
        <div className={styles.modalOverlay} onClick={() => setShowEditModal(false)}>
          <div className={styles.modalDialog} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalContent}>
              <div className={styles.modalHeader}>
                <h5 className={styles.modalTitle}>
                  <i className="fas fa-user-edit"></i>Edit User Account
                </h5>
                <button className={styles.btnClose} onClick={() => setShowEditModal(false)}>
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <div className={styles.modalBody}>
                <form>
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
                      <label className={styles.formLabel}>New Password (leave blank to keep current):</label>
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
                          onClick={() => setShowEditPassword(!showEditPassword)}
                        >
                          <i className={`fas ${showEditPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                        </button>
                      </div>
                      <small className={styles.textMuted}>Leave blank if you don't want to change the password</small>
                    </div>
                  </div>
                </form>
              </div>
              <div className={styles.modalFooter}>
                <button className={styles.btnSecondary} onClick={() => setShowEditModal(false)}>
                  <i className="fas fa-times"></i>Cancel
                </button>
                <button className={styles.btnPrimary} onClick={handleSaveEdit}>
                  <i className="fas fa-save"></i>Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className={styles.modalOverlay} onClick={() => setShowDeleteModal(false)}>
          <div className={styles.modalDialog} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalContent}>
              <div className={styles.modalHeader}>
                <h5 className={`${styles.modalTitle} ${styles.dangerTitle}`}>
                  <i className="fas fa-exclamation-triangle"></i>Confirm Deletion
                </h5>
                <button className={styles.btnClose} onClick={() => setShowDeleteModal(false)}>
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <div className={styles.modalBody}>
                <p>Are you sure you want to delete this user account?</p>
                <div className={styles.userInfoBox}>
                  <strong>{userToDelete?.name}</strong>
                  <p className={styles.textMuted}>This action cannot be undone.</p>
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button className={styles.btnSecondary} onClick={() => setShowDeleteModal(false)}>
                  <i className="fas fa-times"></i>Cancel
                </button>
                <button className={styles.btnDanger} onClick={handleConfirmDelete}>
                  <i className="fas fa-trash"></i>Delete User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification */}
      {notification && (
        <div className={`${styles.notification} ${styles[`notification${notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}`]} ${styles.show}`}>
          <i className={`fas ${notification.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
          <span>{notification.message}</span>
          <button className={styles.notificationClose} onClick={() => setNotification(null)}>
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.container}>
          <hr />
          <p>&copy; 2025 Axis Five Solutions | Admin Panel | All Rights Reserved</p>
        </div>
      </footer>
    </div>
  );
};

export default AdminHome;