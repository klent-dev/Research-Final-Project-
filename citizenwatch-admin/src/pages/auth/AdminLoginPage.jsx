import { useNavigate } from 'react-router-dom';
import { loginAdmin } from '../../services/adminAuthService.js';

export default function AdminLoginPage() {
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    await loginAdmin({
      email: formData.get('email'),
      password: formData.get('password')
    });
    navigate('/');
  }

  return (
    <main className="admin-main">
      <h1>LGU Admin Login</h1>
      <form className="grid" onSubmit={handleSubmit}>
        <label>Email<input type="email" name="email" required /></label>
        <label>Password<input type="password" name="password" required /></label>
        <button className="button">Sign in</button>
      </form>
    </main>
  );
}

