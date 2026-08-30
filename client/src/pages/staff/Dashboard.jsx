import { useState, useEffect, useCallback, useRef } from 'react';
import { requestsAPI } from '../../services/api';
import Navbar from '../../components/Navbar';
import StatusBadge from '../../components/StatusBadge';

const FAIL_REASONS = [
  'Room locked',
  'Student not present',
  'Access denied',
  'Supplies unavailable',
  'Other',
];

export default function StaffDashboard() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [alert, setAlert] = useState(null);

  // Fail modal state
  const [failModal, setFailModal] = useState(null); // request id
  const [failReason, setFailReason] = useState('');
  const [failNote, setFailNote] = useState('');
  const [failPhoto, setFailPhoto] = useState(null); // base64
  const fileRef = useRef(null);

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
    const interval = setInterval(fetchRequests, 30000);
    return () => clearInterval(interval);
  }, [fetchRequests]);

  const handleStart = async (id) => {
    setActionLoading(id);
    try {
      await requestsAPI.start(id);
      setAlert({ type: 'success', message: 'Task started!' });
      fetchRequests();
      setTimeout(() => setAlert(null), 3000);
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.error || 'Action failed' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleComplete = async (id) => {
    setActionLoading(id);
    try {
      await requestsAPI.complete(id);
      setAlert({ type: 'success', message: 'Task marked as completed!' });
      fetchRequests();
      setTimeout(() => setAlert(null), 3000);
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.error || 'Action failed' });
    } finally {
      setActionLoading(null);
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setAlert({ type: 'error', message: 'Photo must be under 5MB' });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => setFailPhoto(reader.result);
    reader.readAsDataURL(file);
  };

  const handleFail = async (e) => {
    e.preventDefault();
    const reason = failReason === 'Other' ? failNote : failReason;
    if (!reason) return;

    setActionLoading(failModal);
    try {
      await requestsAPI.fail(failModal, {
        resolutionNote: reason,
        resolutionPhotoUrl: failPhoto || null,
      });
      setAlert({ type: 'success', message: 'Task marked as failed' });
      setFailModal(null);
      setFailReason('');
      setFailNote('');
      setFailPhoto(null);
      fetchRequests();
      setTimeout(() => setAlert(null), 3000);
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.error || 'Action failed' });
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const activeRequests = requests.filter((r) => ['ASSIGNED', 'IN_PROGRESS'].includes(r.status));
  const doneRequests = requests.filter((r) => ['COMPLETED', 'FAILED', 'CLOSED'].includes(r.status));

  return (
    <>
      <Navbar />
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">My Tasks</h1>
          <p className="page-subtitle">{activeRequests.length} active task(s) assigned to you</p>
        </div>

        {alert && <div className={`alert alert-${alert.type}`}>{alert.message}</div>}

        {/* Stats */}
        <div className="stats-row">
          <div className="stat-card assigned">
            <div className="stat-value">{requests.filter((r) => r.status === 'ASSIGNED').length}</div>
            <div className="stat-label">Assigned</div>
          </div>
          <div className="stat-card in_progress">
            <div className="stat-value">{requests.filter((r) => r.status === 'IN_PROGRESS').length}</div>
            <div className="stat-label">In Progress</div>
          </div>
          <div className="stat-card completed">
            <div className="stat-value">{requests.filter((r) => ['COMPLETED', 'CLOSED'].includes(r.status)).length}</div>
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
            {/* Active Tasks */}
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '16px', color: 'var(--text-primary)' }}>
              Active Tasks
            </h2>
            {activeRequests.length === 0 ? (
              <div className="empty-state card">
                <div className="empty-state-icon">✨</div>
                <div className="empty-state-title">No active tasks</div>
                <div className="empty-state-text">All caught up! Check back later for new assignments.</div>
              </div>
            ) : (
              <div className="request-list">
                {activeRequests.map((req) => (
                  <div key={req.id} className="card" style={{ padding: '20px' }}>
                    <div className="request-card-header">
                      <div>
                        <div className="request-room">Room {req.roomNo}</div>
                        <div className="request-type">{req.cleaningType}</div>
                        {req.comment && (
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                            💬 {req.comment}
                          </p>
                        )}
                      </div>
                      <StatusBadge status={req.status} />
                    </div>
                    <div className="request-meta">
                      <span>🏠 {req.block?.name}</span>
                      <span>👤 {req.student?.name} ({req.student?.regNo})</span>
                      <span>📅 {formatDate(req.createdAt)}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '16px', flexWrap: 'wrap' }}>
                      {req.status === 'ASSIGNED' && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleStart(req.id)}
                          disabled={actionLoading === req.id}
                        >
                          ▶ Start Task
                        </button>
                      )}
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => handleComplete(req.id)}
                        disabled={actionLoading === req.id}
                      >
                        ✓ Mark Completed
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => {
                          setFailModal(req.id);
                          setFailReason('');
                          setFailNote('');
                          setFailPhoto(null);
                        }}
                        disabled={actionLoading === req.id}
                      >
                        ✕ Mark Failed
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Done Tasks */}
            {doneRequests.length > 0 && (
              <>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '32px 0 16px', color: 'var(--text-secondary)' }}>
                  Completed Tasks
                </h2>
                <div className="request-list">
                  {doneRequests.map((req) => (
                    <div key={req.id} className="request-card" style={{ opacity: 0.6, cursor: 'default' }}>
                      <div className="request-card-header">
                        <div>
                          <div className="request-room">Room {req.roomNo}</div>
                          <div className="request-type">{req.cleaningType}</div>
                        </div>
                        <StatusBadge status={req.status} />
                      </div>
                      <div className="request-meta">
                        <span>📅 {formatDate(req.resolvedAt || req.updatedAt)}</span>
                        {req.resolutionNote && <span>📝 {req.resolutionNote}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {/* Fail Modal */}
        {failModal && (
          <div className="modal-overlay" onClick={() => setFailModal(null)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title">Report Failure</h2>
                <button className="modal-close" onClick={() => setFailModal(null)}>✕</button>
              </div>

              <form onSubmit={handleFail}>
                <div className="form-group">
                  <label className="form-label" htmlFor="fail-reason">Reason</label>
                  <select
                    id="fail-reason"
                    className="form-select"
                    value={failReason}
                    onChange={(e) => setFailReason(e.target.value)}
                    required
                  >
                    <option value="">Select reason...</option>
                    {FAIL_REASONS.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                {failReason === 'Other' && (
                  <div className="form-group">
                    <label className="form-label" htmlFor="fail-note">Describe the issue</label>
                    <textarea
                      id="fail-note"
                      className="form-textarea"
                      placeholder="Explain why cleaning couldn't be completed..."
                      value={failNote}
                      onChange={(e) => setFailNote(e.target.value)}
                      required
                      rows={3}
                    />
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Photo Proof (optional)</label>
                  <input
                    type="file"
                    ref={fileRef}
                    accept="image/*"
                    capture="environment"
                    onChange={handlePhotoChange}
                    style={{ display: 'none' }}
                  />
                  <div
                    className={`photo-upload ${failPhoto ? 'has-photo' : ''}`}
                    onClick={() => fileRef.current?.click()}
                  >
                    {failPhoto ? (
                      <img src={failPhoto} alt="Proof" />
                    ) : (
                      <>
                        <div style={{ fontSize: '2rem' }}>📷</div>
                        <div className="photo-upload-text">Click to upload or capture photo</div>
                      </>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-danger btn-lg btn-block"
                  disabled={actionLoading === failModal}
                >
                  {actionLoading === failModal ? 'Submitting...' : 'Submit Failure Report'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
