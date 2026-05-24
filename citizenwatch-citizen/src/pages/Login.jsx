import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaEnvelope, FaGavel, FaLock, FaShieldAlt, FaSignInAlt } from 'react-icons/fa';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import PageContainer from '../components/PageContainer.jsx';
import responseImage from '../assets/images/Response.png';
import communityImage from '../assets/images/Community.png';
import infrastructureImage from '../assets/images/Infrastructure.png';
import { loginCitizen } from '../services/authService.js';

const initialLoginForm = {
  email: '',
  password: ''
};

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(initialLoginForm);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
    setErrorMessage('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setErrorMessage('');

    const form = new FormData(event.currentTarget);
    const email = String(form.get('email') || formData.email || '').trim();
    const password = String(form.get('password') || formData.password || '');

    if (!email || !password) {
      setErrorMessage('Please enter your email and password.');
      return;
    }

    setIsSubmitting(true);

    try {
      await loginCitizen({
        email,
        password
      });
      navigate('/home', { replace: true });
    } catch (error) {
      console.error('Citizen login failed:', error);
      setErrorMessage('Sign in failed. Please check your email and password.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <PageContainer className="login-screen">
      <div className="phone-frame">
        <section className="login-device">
          <div className="login-brand">
            <div className="login-brand__mark">
              <FaGavel aria-hidden="true" />
            </div>
            <h1>CitizenWatch</h1>
            <p>Empowering communities through transparent reporting.</p>
          </div>

          <section className="login-panel">
            <form className="login-form" onSubmit={handleSubmit}>
              <label>
                <span>Email Address</span>
                <div className="login-input">
                  <FaEnvelope aria-hidden="true" />
                  <input
                    autoComplete="email"
                    name="email"
                    onChange={handleChange}
                    placeholder="name@agency.gov"
                    required
                    type="email"
                    value={formData.email}
                  />
                </div>
              </label>

              <label>
                <span className="login-row">
                  Password
                  <Link to="/login">Forgot?</Link>
                </span>
                <div className="login-input">
                  <FaLock aria-hidden="true" />
                  <input
                    autoComplete="current-password"
                    name="password"
                    onChange={handleChange}
                    required
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                  />
                  <button
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="password-toggle"
                    onClick={() => setShowPassword((current) => !current)}
                    type="button"
                  >
                    {showPassword ? <FiEyeOff aria-hidden="true" /> : <FiEye aria-hidden="true" />}
                  </button>
                </div>
              </label>

              {errorMessage && <p className="form-error">{errorMessage}</p>}

              <button className="login-submit" disabled={isSubmitting} type="submit">
                {isSubmitting ? 'Signing In...' : 'Login'}
                <FaSignInAlt aria-hidden="true" />
              </button>
            </form>

            <div className="login-divider" />
            <p className="login-register">
              New to CitizenWatch? <Link to="/register">Create an account</Link>
            </p>
          </section>

          <div className="login-trust-chip">
            <FaShieldAlt aria-hidden="true" />
            Verified reports help LGUs respond faster.
          </div>

          <div className="login-visual-grid" aria-hidden="true">
            <img className="login-visual" src={infrastructureImage} alt="" />
            <img className="login-visual" src={communityImage} alt="" />
            <img className="login-visual" src={responseImage} alt="" />
          </div>

          <footer className="login-footer">
            &copy; 2024 CitizenWatch Portal &bull; Securing Communities
          </footer>
        </section>
      </div>
    </PageContainer>
  );
}
