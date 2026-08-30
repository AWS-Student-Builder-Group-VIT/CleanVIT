import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { blocksAPI } from '../services/api';

export default function Login() {
  const [mode, setMode] = useState('student'); // 'student' or 'staff'
  const [regNo, setRegNo] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [blockId, setBlockId] = useState('');
  const [blocks, setBlocks] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    blocksAPI.getAll()
      .then((res) => setBlocks(res.data))
      .catch((err) => console.error('Failed to load blocks:', err));
  }, []);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const credentials = mode === 'student'
        ? { regNo, password }
        : { email, password, blockId };

      const user = await login(credentials);

      // Redirect based on role
      const dashboardMap = {
        STUDENT: '/student/dashboard',
        SUPERVISOR: '/supervisor/dashboard',
        STAFF: '/staff/dashboard',
      };
      navigate(dashboardMap[user.role] || '/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <h1>CleanTrack</h1>
          <p>Room Cleaning Request System</p>
        </div>

        {/* Mode toggle */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          <button
            type="button"
            className={`btn ${mode === 'student' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ flex: 1 }}
            onClick={() => { setMode('student'); setError(''); }}
          >
            Student
          </button>
          <button
            type="button"
            className={`btn ${mode === 'staff' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ flex: 1 }}
            onClick={() => { setMode('staff'); setError(''); }}
          >
            Staff / Supervisor
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          {mode === 'student' ? (
            <div className="form-group">
              <label className="form-label" htmlFor="login-regno">Registration Number</label>
              <input
                id="login-regno"
                className="form-input"
                type="text"
                placeholder="e.g. 22BCE1234"
                value={regNo}
                onChange={(e) => setRegNo(e.target.value)}
                required
                autoFocus
              />
            </div>
          ) : (
            <>
              <div className="form-group">
                <label className="form-label" htmlFor="login-block">Block</label>
                <select
                  id="login-block"
                  className="form-select"
                  value={blockId}
                  onChange={(e) => setBlockId(e.target.value)}
                  required
                >
                  <option value="">Select your block</option>
                  {blocks.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.type.toLowerCase()})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="login-email">Email</label>
                <input
                  id="login-email"
                  className="form-input"
                  type="email"
                  placeholder="e.g. supervisor.a@cleantrack.app"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="login-password">Password</label>
            <input
              id="login-password"
              className="form-input"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {mode === 'student' && (
          <div className="auth-footer">
            Don't have an account? <Link to="/signup">Sign up</Link>
          </div>
        )}
      </div>
    </div>
  );
}
