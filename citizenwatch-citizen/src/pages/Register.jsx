import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaArrowRight, FaShieldAlt } from 'react-icons/fa';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import PageContainer from '../components/PageContainer.jsx';
import { registerCitizen } from '../services/authService.js';

const initialForm = {
  fullName: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: ''
};

function validateForm(formData) {
  const nextErrors = {};
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!formData.fullName.trim()) nextErrors.fullName = 'Full name is required.';
  if (!formData.email.trim()) {
    nextErrors.email = 'Email address is required.';
  } else if (!emailPattern.test(formData.email)) {
    nextErrors.email = 'Enter a valid email address.';
  }

  if (!formData.phone.trim()) nextErrors.phone = 'Phone number is required.';
  if (!formData.password) {
    nextErrors.password = 'Password is required.';
  } else if (formData.password.length < 6) {
    nextErrors.password = 'Password must be at least 6 characters.';
  }

  if (!formData.confirmPassword) {
    nextErrors.confirmPassword = 'Please confirm your password.';
  } else if (formData.password !== formData.confirmPassword) {
    nextErrors.confirmPassword = 'Passwords do not match.';
  }

  return nextErrors;
}

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: '' }));
    setSuccessMessage('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const validationErrors = validateForm(formData);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) return;

    setIsSubmitting(true);
    setSuccessMessage('');

    try {
      await registerCitizen({
        email: formData.email.trim(),
        password: formData.password,
        fullName: formData.fullName.trim(),
        displayName: formData.fullName.trim(),
        phoneNumber: formData.phone.trim()
      });
      setSuccessMessage('Account created successfully.');
      navigate('/home', { replace: true });
    } catch (error) {
      console.error('Citizen registration failed:', error);
      setErrors((current) => ({
        ...current,
        form: error.code === 'auth/email-already-in-use'
          ? 'This email is already registered. Please log in instead.'
          : 'Unable to create account. Please check your details and try again.'
      }));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <PageContainer className="register-screen">
      <header className="register-topbar">
        <Link to="/login" aria-label="Back to login">
          <FaArrowLeft aria-hidden="true" />
        </Link>
        <strong>CitizenWatch</strong>
        <span aria-hidden="true" />
      </header>

      <section className="register-card">
        <div className="register-card__icon">
          <FaShieldAlt aria-hidden="true" />
        </div>
        <h1>Join CitizenWatch</h1>
        <p>Empower your community with transparent reporting.</p>

        <form className="register-form" onSubmit={handleSubmit} noValidate>
          <label>
            <span>Full Name</span>
            <input
              name="fullName"
              onChange={handleChange}
              placeholder="Enter your full name"
              type="text"
              value={formData.fullName}
            />
            {errors.fullName && <small className="field-error">{errors.fullName}</small>}
          </label>

          <label>
            <span>Email Address</span>
            <input
              name="email"
              onChange={handleChange}
              placeholder="name@example.com"
              type="email"
              value={formData.email}
            />
            {errors.email && <small className="field-error">{errors.email}</small>}
          </label>

          <label>
            <span>Phone Number</span>
            <input
              name="phone"
              onChange={handleChange}
              placeholder="+63 900 000 0000"
              type="tel"
              value={formData.phone}
            />
            {errors.phone && <small className="field-error">{errors.phone}</small>}
          </label>

          <label>
            <span>Password</span>
            <div className="register-password-field">
              <input
                name="password"
                onChange={handleChange}
                placeholder="Password"
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
            {errors.password && <small className="field-error">{errors.password}</small>}
          </label>

          <label>
            <span>Confirm Password</span>
            <div className="register-password-field">
              <input
                name="confirmPassword"
                onChange={handleChange}
                placeholder="Confirm password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
              />
              <button
                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                className="password-toggle"
                onClick={() => setShowConfirmPassword((current) => !current)}
                type="button"
              >
                {showConfirmPassword ? <FiEyeOff aria-hidden="true" /> : <FiEye aria-hidden="true" />}
              </button>
            </div>
            {errors.confirmPassword && <small className="field-error">{errors.confirmPassword}</small>}
          </label>

          {errors.form && <p className="form-error">{errors.form}</p>}
          {successMessage && <p className="form-success">{successMessage}</p>}

          <div className="register-auth-actions">
            <button className="register-submit" disabled={isSubmitting} type="submit">
              {isSubmitting ? 'Creating Account...' : 'Create Account'}
              <FaArrowRight aria-hidden="true" />
            </button>

            <p className="register-login-link">
              Already have an account? <Link to="/login">Log in</Link>
            </p>
          </div>
        </form>
      </section>

      <p className="register-security-note">
        <FaShieldAlt aria-hidden="true" />
        Your data is secured with LGU-grade encryption.
      </p>
    </PageContainer>
  );
}
