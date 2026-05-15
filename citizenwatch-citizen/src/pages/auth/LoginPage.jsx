import { Link, useNavigate } from 'react-router-dom';
import { loginCitizen } from '../../services/authService.js';

export default function LoginPage() {
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    await loginCitizen({
      email: formData.get('email'),
      password: formData.get('password')
    });
    navigate('/');
  }

  return (
    <main className="page">
      <h1>Citizen Login</h1>
      <form className="form-grid" onSubmit={handleSubmit}>
        <label className="field">Email<input type="email" name="email" required /></label>
        <label className="field">Password<input type="password" name="password" required /></label>
        <button className="button">Sign in</button>
      </form>
      <p><Link to="/register">Create an account</Link></p>
    </main>
  );
}

