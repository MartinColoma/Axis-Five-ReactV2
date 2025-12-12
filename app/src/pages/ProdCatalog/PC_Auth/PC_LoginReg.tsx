import { useState } from 'react';
import type { FormEvent, FC } from 'react';
import axios from 'axios';
import { X, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import styles from './PC_LoginReg.module.css';
import usePageMeta from  '../../../hooks/usePageMeta';
import { useAuth } from '../../../contexts/AuthContext'; // Import auth context

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

interface FormData {
  username: string;
  password: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  confirmPassword?: string;
}

type AuthMode = 'login' | 'register';
type RegisterStep = 1 | 2;

// API Configuration
const API_BASE = import.meta.env.VITE_API_BASE_URL; // VITE_API_LOCAL_SERVER // VITE_API_BASE_URL

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const AuthModal: FC<AuthModalProps> = ({ 
  isOpen, 
  onClose, 
  initialMode = 'login'
}) => {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [registerStep, setRegisterStep] = useState<RegisterStep>(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  // Use auth context
  const { login } = useAuth();
  
  usePageMeta("AxisFive Store - Login/Register", "/images/Logos/A5_Logo1.png");

  const [formData, setFormData] = useState<FormData>({
    username: '',
    password: '',
    firstName: '',
    lastName: '',
    email: '',
    confirmPassword: '',
  });

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const togglePassword = (field: 'password' | 'confirmPassword') => {
    if (field === 'password') {
      setShowPassword(!showPassword);
    } else {
      setShowConfirmPassword(!showConfirmPassword);
    }
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleLoginSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.username || !formData.password) {
      setError('Please fill in all fields!');
      setLoading(false);
      return;
    }

    try {
      const response = await api.post('/api/auth/login', {
        emailOrUsername: formData.username,
        password: formData.password,
      });

      const { data } = response;

      if (data && data.user && data.token) {
        setSuccess('Login successful!');
        
        // Use auth context to handle login (updates global state immediately)
        login(data.token, data.user);
        
        // Close modal and navigate
        setTimeout(() => {
          onClose();
          navigate('/product-catalog', { replace: true });
        }, 500);
      }
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.response?.status === 401 || err.response?.status === 400) {
        setError('Invalid username or password!');
      } else if (err.code === 'ECONNABORTED') {
        setError('Request timed out. Please check your internet connection.');
      } else if (err.request) {
        setError('Cannot connect to the server. Please check your network.');
      } else {
        setError(err.response?.data?.message || 'Unable to connect to the server. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterNext = () => {
    if (!formData.firstName || !formData.lastName || !formData.email) {
      setError('Please fill in all fields.');
      return;
    }

    if (!validateEmail(formData.email || '')) {
      setError('Invalid email format.');
      return;
    }

    setError('');
    setRegisterStep(2);
  };

  const handleRegisterSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.username || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all fields.');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match. Please re-enter the confirmation password.');
      setFormData((prev) => ({ ...prev, confirmPassword: '' }));
      setLoading(false);
      return;
    }

    try {
      const response = await api.post('/api/auth/register', {
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        username: formData.username,
        password: formData.password,
      });

      if (response.status === 200 || response.status === 201) {
        setSuccess('Registration successful! You can now login.');
        setFormData({
          username: '',
          password: '',
          firstName: '',
          lastName: '',
          email: '',
          confirmPassword: '',
        });
        setRegisterStep(1);
        setTimeout(() => {
          setMode('login');
          setSuccess('');
        }, 2000);
      }
    } catch (err: any) {
      console.error('Registration error:', err);

      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.code === 'ECONNABORTED') {
        setError('Request timed out. Please check your internet connection.');
      } else if (err.request) {
        setError('Cannot connect to the server. Please check your network.');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setError('');
    setSuccess('');
    setRegisterStep(1);
    setFormData({
      username: '',
      password: '',
      firstName: '',
      lastName: '',
      email: '',
      confirmPassword: '',
    });
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={handleOverlayClick}>
      <div className={styles.modalContainer}>
        <button className={styles.closeButton} onClick={onClose} aria-label="Close modal">
          <X size={24} />
        </button>

        <div className={styles.modalContent}>
          <div className={styles.contentWrapper}>
            {/* SVG Illustration */}
            <div className={styles.illustrationContainer}>
              <img 
                src="/online-tech-talks-animate.svg" 
                alt="Online Tech Talks" 
                className={styles.illustration}
              />
            </div>

            {/* Form Section */}
            <div className={styles.formSection}>
              <div className={styles.tabContainer}>
                <button
                  className={`${styles.tab} ${mode === 'login' ? styles.activeTab : ''}`}
                  onClick={() => switchMode('login')}
                >
                  Login
                </button>
                <button
                  className={`${styles.tab} ${mode === 'register' ? styles.activeTab : ''}`}
                  onClick={() => switchMode('register')}
                >
                  Register
                </button>
              </div>

              {error && (
                <div className={`${styles.alert} ${styles.alertDanger}`}>
                  {error}
                  <button
                    className={styles.alertClose}
                    onClick={() => setError('')}
                    aria-label="Close"
                  >
                    <X size={18} />
                  </button>
                </div>
              )}

              {success && (
                <div className={`${styles.alert} ${styles.alertSuccess}`}>
                  {success}
                </div>
              )}

              {mode === 'login' ? (
                <div>
                  <div className={styles.formGroup}>
                    <label htmlFor="username" className={styles.label}>
                      Username or Email:
                    </label>
                    <input
                      type="text"
                      id="username"
                      name="username"
                      className={styles.input}
                      placeholder="Enter your username or email"
                      value={formData.username}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="password" className={styles.label}>
                      Password:
                    </label>
                    <div className={styles.passwordWrapper}>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        name="password"
                        className={styles.input}
                        placeholder="Enter your password"
                        value={formData.password}
                        onChange={handleInputChange}
                        required
                      />
                      <button
                        type="button"
                        className={styles.togglePassword}
                        onClick={() => togglePassword('password')}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    className={styles.btnPrimary}
                    onClick={handleLoginSubmit}
                    disabled={loading}
                  >
                    {loading ? 'Logging in...' : 'Login'}
                  </button>
                </div>
              ) : (
                <div>
                  <div className={`${styles.formStep} ${registerStep === 1 ? styles.active : ''}`}>
                    <div className={styles.row}>
                      <div className={styles.col}>
                        <div className={styles.formGroup}>
                          <label className={styles.label}>
                            First Name:
                          </label>
                          <input
                            type="text"
                            name="firstName"
                            className={styles.input}
                            placeholder="Enter your first name"
                            value={formData.firstName}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                      </div>
                      <div className={styles.col}>
                        <div className={styles.formGroup}>
                          <label className={styles.label}>
                            Last Name:
                          </label>
                          <input
                            type="text"
                            name="lastName"
                            className={styles.input}
                            placeholder="Enter your last name"
                            value={formData.lastName}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>
                        Email Address:
                      </label>
                      <input
                        type="email"
                        name="email"
                        className={styles.input}
                        placeholder="example@email.com"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <button
                      type="button"
                      className={styles.btnPrimary}
                      onClick={handleRegisterNext}
                    >
                      Next
                    </button>
                  </div>

                  <div className={`${styles.formStep} ${registerStep === 2 ? styles.active : ''}`}>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>
                        Username:
                      </label>
                      <input
                        type="text"
                        name="username"
                        className={styles.input}
                        placeholder="Choose a username"
                        value={formData.username}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>
                        Password:
                      </label>
                      <div className={styles.passwordWrapper}>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          name="password"
                          className={styles.input}
                          placeholder="Create a strong password"
                          value={formData.password}
                          onChange={handleInputChange}
                          required
                        />
                        <button
                          type="button"
                          className={styles.togglePassword}
                          onClick={() => togglePassword('password')}
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>
                        Confirm Password:
                      </label>
                      <div className={styles.passwordWrapper}>
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          name="confirmPassword"
                          className={styles.input}
                          placeholder="Re-enter your password"
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          required
                        />
                        <button
                          type="button"
                          className={styles.togglePassword}
                          onClick={() => togglePassword('confirmPassword')}
                        >
                          {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    <div className={styles.buttonGroup}>
                      <button
                        type="button"
                        className={styles.btnOutline}
                        onClick={() => setRegisterStep(1)}
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        className={styles.btnPrimary}
                        onClick={handleRegisterSubmit}
                        disabled={loading}
                      >
                        {loading ? 'Registering...' : 'Register'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;