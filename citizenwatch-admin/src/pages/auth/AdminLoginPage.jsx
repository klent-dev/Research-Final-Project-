import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginAdmin } from '../../services/adminAuthService.js';

export default function AdminLoginPage() {
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);

    try {
      await loginAdmin({
        email: formData.get('email'),
        password: formData.get('password')
      });
      navigate('/');
    } catch {
      setErrorMessage('Sign in failed. Check your credentials and try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="admin-login-page">
      <section className="admin-login-shell" aria-label="CitizenWatch admin sign in">
        <header className="admin-login-brand">
          <div className="admin-login-seal" aria-hidden="true">
            <span>CW</span>
          </div>
          <h1>CitizenWatch</h1>
          <p>Admin Portal Management System</p>
        </header>

        <form className="admin-login-card" onSubmit={handleSubmit}>
          <div className="admin-login-card__heading">
            <h2>Secure Sign In</h2>
            <p>Enter your credentials to access the command console.</p>
          </div>

          <label className="admin-login-field">
            <span>Government Email</span>
            <div className="admin-login-input">
              <span aria-hidden="true">@</span>
              <input
                autoComplete="email"
                name="email"
                placeholder="admin@lgu.gov.ph"
                required
                type="email"
              />
            </div>
          </label>

          <label className="admin-login-field">
            <span>
              Password
              <a href="/login" onClick={(event) => event.preventDefault()}>Forgot?</a>
            </span>
            <div className="admin-login-input">
              <span aria-hidden="true">#</span>
              <input
                autoComplete="current-password"
                name="password"
                placeholder="Password"
                required
                type="password"
              />
              <span aria-hidden="true">o</span>
            </div>
          </label>

          <p className="admin-login-mfa">
            <span aria-hidden="true">✓</span>
            Multi-factor authentication (MFA) will be required upon the next step.
          </p>

          {errorMessage && <p className="admin-login-error">{errorMessage}</p>}

          <button className="admin-login-submit" disabled={isSubmitting} type="submit">
            {isSubmitting ? 'Signing In...' : 'Sign In to Console'}
            <span aria-hidden="true">→</span>
          </button>
        </form>

        <footer className="admin-login-footer">
          <strong>Authorized Personnel Only. Monitored Government Access.</strong>
          <p>© 2024 Municipal Information Office</p>
          <nav aria-label="Admin portal links">
            <a href="/login" onClick={(event) => event.preventDefault()}>Privacy Policy</a>
            <a href="/login" onClick={(event) => event.preventDefault()}>Security Audit</a>
            <a href="/login" onClick={(event) => event.preventDefault()}>Support</a>
          </nav>
        </footer>
      </section>
    </main>
  );
}
