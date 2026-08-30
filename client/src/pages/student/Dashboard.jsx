import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { requestsAPI } from '../../services/api';
import Navbar from '../../components/Navbar';
import StatusBadge from '../../components/StatusBadge';

const CLEANING_TYPES = [
  'Sweeping',
  'Mopping',
  'Washroom Cleaning',
  'Waste Disposal',
  'Full Room Cleaning',
  'Other',
];

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [cleaningType, setCleaningType] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState(null);

  const fetchRequests = useCallback(async () => {
    try {
      const res = await requestsAPI.getAll();
      setRequests(res.data);
    } catch (err) {
      console.error('Failed to fetch requests:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
    // Auto-poll every 30 seconds
    const interval = setInterval(fetchRequests, 30000);
    return () => clearInterval(interval);
  }, [fetchRequests]);

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    if (!cleaningType) return;

    setSubmitting(true);
    try {
      await requestsAPI.create({ cleaningType, comment });
      setShowModal(false);
      setCleaningType('');
      setComment('');
      setAlert({ type: 'success', message: 'Cleaning request raised successfully!' });
      fetchRequests();
      setTimeout(() => setAlert(null), 4000);
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.error || 'Failed to create request' });
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const activeRequests = requests.filter((r) => !['CLOSED'].includes(r.status));
  const closedRequests = requests.filter((r) => r.status === 'CLOSED');

  return (
    <>
      <Navbar />
      <div className="page-container">
        <div className="flex-between" style={{ marginBottom: '24px' }}>
          <div className="page-header" style={{ marginBottom: 0 }}>
            <h1 className="page-title">My Dashboard</h1>
            <p className="page-subtitle">
              Room {user?.roomNo} • {user?.blockName || 'Block'}
            </p>
          </div>
          <button className="btn btn-primary btn-lg" onClick={() => setShowModal(true)}>
            + Raise Request
          </button>
        </div>

        {alert && (
          <div className={`alert alert-${alert.type}`}>{alert.message}</div>
        )}

        {/* Stats */}
        <div className="stats-row">
          <div className="stat-card total">
            <div className="stat-value">{requests.length}</div>
            <div className="stat-label">Total</div>
          </div>
          <div className="stat-card pending">
            <div className="stat-value">{requests.filter((r) => r.status === 'PENDING').length}</div>
            <div className="stat-label">Pending</div>
          </div>
          <div className="stat-card assigned">
            <div className="stat-value">{requests.filter((r) => ['ASSIGNED', 'IN_PROGRESS'].includes(r.status)).length}</div>
            <div className="stat-label">In Progress</div>
          </div>
          <div className="stat-card completed">
            <div className="stat-value">{requests.filter((r) => r.status === 'COMPLETED').length}</div>
            <div className="stat-label">Completed</div>
          </div>
          <div className="stat-card failed">
            <div className="stat-value">{requests.filter((r) => r.status === 'FAILED').length}</div>
            <div className="stat-label">Failed</div>
          </div>
        </div>

        {loading ? (
          <div className="spinner-container"><div className="spinner"></div></div>
        ) : (
          <>
            {/* Active Requests */}
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '16px', color: 'var(--text-primary)' }}>
              Active Requests
            </h2>
            {activeRequests.length === 0 ? (
              <div className="empty-state card">
                <div className="empty-state-icon">🧹</div>
                <div className="empty-state-title">No active requests</div>
                <div className="empty-state-text">Raise a cleaning request to get started</div>
              </div>
            ) : (
              <div className="request-list">
                {activeRequests.map((req) => (
                  <div
                    key={req.id}
                    className="request-card"
                    onClick={() => navigate(`/student/requests/${req.id}`)}
                  >
                    <div className="request-card-header">
                      <div>
                        <div className="request-room">Room {req.roomNo}</div>
                        <div className="request-type">{req.cleaningType}</div>
                      </div>
                      <StatusBadge status={req.status} />
                    </div>
                    {req.comment && (
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        {req.comment}
                      </p>
                    )}
                    <div className="request-meta">
                      <span>📅 {formatDate(req.createdAt)}</span>
                      {req.assignedStaff && <span>👷 {req.assignedStaff.name}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Closed Requests */}
            {closedRequests.length > 0 && (
              <>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '32px 0 16px', color: 'var(--text-secondary)' }}>
                  Closed Requests
                </h2>
                <div className="request-list">
                  {closedRequests.map((req) => (
                    <div
                      key={req.id}
                      className="request-card"
                      style={{ opacity: 0.6 }}
                      onClick={() => navigate(`/student/requests/${req.id}`)}
                    >
                      <div className="request-card-header">
                        <div>
                          <div className="request-room">Room {req.roomNo}</div>
                          <div className="request-type">{req.cleaningType}</div>
                        </div>
                        <StatusBadge status={req.status} />
                      </div>
                      <div className="request-meta">
                        <span>📅 {formatDate(req.createdAt)}</span>
                        <span>✅ Confirmed {formatDate(req.studentConfirmedAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {/* Create Request Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title">Raise Cleaning Request</h2>
                <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
              </div>

              <div className="alert alert-info" style={{ marginBottom: '16px' }}>
                Room <strong>{user?.roomNo}</strong> • {user?.blockName}
              </div>

              <form onSubmit={handleCreateRequest}>
                <div className="form-group">
                  <label className="form-label" htmlFor="modal-type">Cleaning Type</label>
                  <select
                    id="modal-type"
                    className="form-select"
                    value={cleaningType}
                    onChange={(e) => setCleaningType(e.target.value)}
                    required
                  >
                    <option value="">Select type...</option>
                    {CLEANING_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="modal-comment">Comment (optional)</label>
                  <textarea
                    id="modal-comment"
                    className="form-textarea"
                    placeholder="Add any details..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={3}
                  />
                </div>

                <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
