
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminLogin() {
  const [token, setToken] = useState('');
  const navigate = useNavigate();

  const handleLogin = () => {
    if (token === 'secret123') {
      localStorage.setItem('admin_token', token);
      navigate('/admin/mints');
    } else {
      alert('Pogrešan token!');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
      <h1 className="text-2xl font-bold mb-4">🔐 Admin Login</h1>
      <input
        type="password"
        placeholder="Unesi admin token..."
        className="p-2 rounded bg-gray-800 border border-gray-600 mb-2"
        value={token}
        onChange={(e) => setToken(e.target.value)}
      />
      <button onClick={handleLogin} className="bg-blue-600 px-4 py-2 rounded">Login</button>
    </div>
  );
}
