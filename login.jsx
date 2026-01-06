import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; 
import logoLight from './logo.png';     
import logoDark from './logodark.png';  
import './logincss.css';

// --- ICONS ---
const SunIcon = ({ className }) => (
  <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
);
const MoonIcon = ({ className }) => (
  <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
);
const UserIcon = ({ className }) => (
  <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
);
const MailIcon = ({ className }) => (
  <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
);
const LockIcon = ({ className }) => (
  <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
);
const EyeIcon = ({ className }) => (
  <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
);
const EyeOffIcon = ({ className }) => (
  <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
);

const AuthPage = () => {
  const navigate = useNavigate(); 
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState('');

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); 
    setError('');

    const endpoint = isLogin ? `${API_BASE_URL}/api/login` : `${API_BASE_URL}/api/register`;
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      if (isLogin) {
        localStorage.setItem('token', data.token); 
        navigate('/home'); 
      } else {
        alert('Registration Successful! Please log in.');
        setIsLogin(true); 
      }

    } catch (err) {
      setError(err.message);
    }
  };

  // Logic to handle logo switching via CSS based on parent .dark-theme class
  const logoStyles = `
    .app-logo.dark-mode { display: none; }
    .app-logo.light-mode { display: block; }

    /* When .dark-theme is present on body or wrapper, switch visibility */
    .dark-theme .app-logo.light-mode, 
    body.dark-theme .app-logo.light-mode {
        display: none;
    }
    .dark-theme .app-logo.dark-mode, 
    body.dark-theme .app-logo.dark-mode {
        display: block;
    }
  `;

  return (
    <div className="auth-wrapper">
      <style>{logoStyles}</style>
      
      {/* --- LEFT SIDE --- */}
      <div className="auth-left">
        <div className="corner-logo-container">
            <Link to="/" className="nav-logo">
               {/* Render both logos and let CSS hide one based on theme */}
               <img 
                 src={logoLight} 
                 alt="Sympto Logo" 
                 className="app-logo light-mode"
               />
               <img 
                 src={logoDark} 
                 alt="Sympto Logo" 
                 className="app-logo dark-mode"
               />
            </Link>
        </div>
        <div className="auth-text-content">
          {isLogin ? (
            <>
              <h1>Sympto AI</h1>
              <h2>Welcome Back.</h2>
              <p>Log in to access your dashboard, view past assessments, and continue your consultation.</p>
            </>
          ) : (
            <>
              <h1>Join Us</h1>
              <h2>Start Your Journey.</h2>
              <p>Create a new account today to start tracking symptoms and getting instant medical insights.</p>
            </>
          )}
        </div>
      </div>

      {/* --- RIGHT SIDE --- */}
      <div className="auth-right">
        
        <div className="auth-form-container">
          <div className="auth-header">
            <h2>{isLogin ? 'Welcome Back' : 'Get Started'}</h2>
            <p className="sub-text">
              {isLogin ? 'Enter your credentials to access your account.' : 'Create your account to start tracking symptoms.'}
            </p>
          </div>

          <form className="auth-form-content" onSubmit={handleSubmit}>
            {error && <p style={{color: '#ef4444', fontSize: '14px', marginBottom: '10px'}}>{error}</p>}

            {!isLogin && (
              <div className="auth-input-group">
                <label>Full Name</label>
                <div className="custom-input-wrapper">
                  <span className="input-icon"><UserIcon /></span>
                  <input type="text" name="fullName" placeholder="sympto user" required value={formData.fullName} onChange={handleChange} />
                </div>
              </div>
            )}

            <div className="auth-input-group">
              <label>Email Address</label>
              <div className="custom-input-wrapper">
                <span className="input-icon"><MailIcon /></span>
                <input type="email" name="email" placeholder="patient@example.com" required value={formData.email} onChange={handleChange} />
              </div>
            </div>

            <div className="auth-input-group">
              <div className="auth-label-row"><label>Password</label></div>
              <div className="custom-input-wrapper">
                <span className="input-icon"><LockIcon /></span>
                <input type={showPassword ? "text" : "password"} name="password" placeholder="••••••••" className="password-input" required value={formData.password} onChange={handleChange} />
                <button type="button" className="password-toggle-btn" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            <button type="submit" className="auth-submit-btn">
              {isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button onClick={() => { setIsLogin(!isLogin); setError(''); }} className="auth-toggle-btn">
                {isLogin ? 'Sign Up' : 'Log In'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;