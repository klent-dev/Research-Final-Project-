import { Link, useNavigate } from 'react-router-dom';
import { registerCitizen } from '../../services/authService.js';

export default function RegisterPage() {
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    await registerCitizen({
      displayName: formData.get('displayName'),
      email: formData.get('email'),
      password: formData.get('password')
    });
    navigate('/');
  }

  return (
    <main className="page">
      <h1>Create Citizen Account</h1>
      <form className="form-grid" onSubmit={handleSubmit}>
        <label className="field">Full name<input name="displayName" required /></label>
        <label className="field">Email<input type="email" name="email" required /></label>
        <label className="field">Password<input type="password" name="password" minLength="8" required /></label>
        <button className="button">Register</button>
      </form>
      <p><Link to="/login">Already have an account?</Link></p>
    </main>
  );
}

