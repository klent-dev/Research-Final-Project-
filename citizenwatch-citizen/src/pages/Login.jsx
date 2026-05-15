import { Link } from 'react-router-dom';
import { FaEnvelope, FaEye, FaGavel, FaLock, FaShieldAlt, FaSignInAlt } from 'react-icons/fa';
import PageContainer from '../components/PageContainer.jsx';
import responseImage from '../assets/images/Response.png';
import communityImage from '../assets/images/Community.png';
import infrastructureImage from '../assets/images/Infrastructure.png';

export default function Login() {
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
            <form className="login-form">
              <label>
                <span>Email Address</span>
                <div className="login-input">
                  <FaEnvelope aria-hidden="true" />
                  <input type="email" placeholder="name@agency.gov" />
                </div>
              </label>

              <label>
                <span className="login-row">
                  Password
                  <Link to="/login">Forgot?</Link>
                </span>
                <div className="login-input">
                  <FaLock aria-hidden="true" />
                  <input type="password" defaultValue="citizenwatch" />
                  <FaEye aria-hidden="true" />
                </div>
              </label>

              <Link className="login-submit" to="/home">
                Login
                <FaSignInAlt aria-hidden="true" />
              </Link>
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
