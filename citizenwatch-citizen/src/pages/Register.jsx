import { Link } from 'react-router-dom';
import { HiEnvelope, HiEye, HiLockClosed, HiShieldCheck, HiUserCircle } from 'react-icons/hi2';
import FormInput from '../components/FormInput.jsx';
import PageContainer from '../components/PageContainer.jsx';
import PrimaryButton from '../components/PrimaryButton.jsx';

export default function Register() {
  return (
    <PageContainer className="auth-page">
      <div className="auth-split auth-split--reverse">
        <section className="auth-hero">
          <div className="auth-logo">CW</div>
          <div className="auth-hero__badge">
            <HiShieldCheck />
            Verified Citizen Access
          </div>
          <h1>Join the community reporting network.</h1>
          <p>Report. Verify. Resolve. Create a secure profile for submitting civic concerns and tracking LGU action.</p>
          <div className="auth-hero__stats">
            <span><strong>Fast</strong> Intake</span>
            <span><strong>Clean</strong> Records</span>
            <span><strong>Mobile</strong> First</span>
          </div>
        </section>

        <section className="auth-card glass-card">
          <div className="auth-card__seal">
            <HiUserCircle />
          </div>
          <p className="eyebrow">New citizen account</p>
          <h2>Create your profile</h2>
          <p>Set up your citizen profile to keep your reports organized, traceable, and ready for verification.</p>

          <form className="form">
            <FormInput icon={HiUserCircle} label="Full name" type="text" placeholder="Juan Dela Cruz" />
            <FormInput icon={HiEnvelope} label="Email address" type="email" placeholder="citizen@example.com" />
            <FormInput icon={HiLockClosed} label="Password" className="password-field">
              <div className="password-shell">
                <input type="password" placeholder="Create password" />
                <HiEye aria-hidden="true" />
              </div>
            </FormInput>
            <FormInput icon={HiLockClosed} label="Confirm password" className="password-field">
              <div className="password-shell">
                <input type="password" placeholder="Confirm password" />
                <HiEye aria-hidden="true" />
              </div>
            </FormInput>
            <PrimaryButton to="/home" icon={HiShieldCheck}>Create account</PrimaryButton>
          </form>
          <p className="trust-note">
            <HiShieldCheck aria-hidden="true" />
            Citizen profiles prepare reports for faster LGU validation.
          </p>
          <p className="auth-switch">
            Already registered? <Link to="/login">Login</Link>
          </p>
        </section>
      </div>
    </PageContainer>
  );
}
