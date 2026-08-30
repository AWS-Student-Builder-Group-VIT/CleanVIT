import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { requestsAPI } from '../../services/api';
import Navbar from '../../components/Navbar';
import StatusBadge from '../../components/StatusBadge';

export default function RequestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  const fetchRequest = async () => {
    try {
      const res = await requestsAPI.getById(id);
      setRequest(res.data);
    } catch (err) {
      setAlert({ type: 'error', message: 'Failed to load request details' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequest();
    const interval = setInterval(fetchRequest, 15000);
    return () => clearInterval(interval);
  }, [id]);

  const handleClose = async () => {
    setActionLoading(true);
    try {
      await requestsAPI.close(id);
      setAlert({ type: 'success', message: 'Request marked as done!' });
      fetchRequest();
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.error || 'Action failed' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReraise = async () => {
    setActionLoading(true);
    try {
      const res = await requestsAPI.reraise(id, {});
      setAlert({ type: 'success', message: 'Request re-raised successfully!' });
      setTimeout(() => navigate(`/student/requests/${res.data.id}`), 1500);
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.error || 'Action failed' });
    } finally {
      setActionLoading(false);
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

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="page-container">
          <div className="spinner-container"><div className="spinner"></div></div>
        </div>
      </>
    );
  }

  if (!request) {
    return (
      <>
        <Navbar />
        <div className="page-container">
          <div className="empty-state card">
            <div className="empty-state-title">Request not found</div>
            <button className="btn btn-ghost mt-md" onClick={() => navigate('/student/dashboard')}>
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="page-container">
        <div className="detail-header">
          <button className="detail-back" onClick={() => navigate('/student/dashboard')}>
            ← Back
          </button>
          <div style={{ flex: 1 }}>
            <h1 className="page-title" style={{ fontSize: '1.75rem' }}>
              Room {request.roomNo} — {request.cleaningType}
            </h1>
          </div>
          <StatusBadge status={request.status} />
        </div>

        {alert && <div className={`alert alert-${alert.type}`}>{alert.message}</div>}

        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="detail-grid">
            <div className="detail-field">
              <div className="detail-field-label">Block</div>
              <div className="detail-field-value">{request.block?.name}</div>
            </div>
            <div className="detail-field">
              <div className="detail-field-label">Room No.</div>
              <div className="detail-field-value">{request.roomNo}</div>
            </div>
            <div className="detail-field">
              <div className="detail-field-label">Cleaning Type</div>
              <div className="detail-field-value">{request.cleaningType}</div>
            </div>
            <div className="detail-field">
              <div className="detail-field-label">Raised On</div>
              <div className="detail-field-value">{formatDate(request.createdAt)}</div>
            </div>
            {request.assignedStaff && (
              <div className="detail-field">
                <div className="detail-field-label">Assigned Staff</div>
                <div className="detail-field-value">{request.assignedStaff.name}</div>
              </div>
            )}
            {request.assignedAt && (
              <div className="detail-field">
                <div className="detail-field-label">Assigned At</div>
                <div className="detail-field-value">{formatDate(request.assignedAt)}</div>
              </div>
            )}
            {request.comment && (
              <div className="detail-field full-width">
                <div className="detail-field-label">Your Comment</div>
                <div className="detail-field-value">{request.comment}</div>
              </div>
            )}
          </div>
        </div>

        {/* Failure Details */}
        {request.status === 'FAILED' && (
          <div className="card" style={{ marginBottom: '24px', borderColor: 'rgba(248, 113, 113, 0.3)' }}>
            <h3 style={{ color: 'var(--error)', marginBottom: '12px', fontWeight: 700 }}>
              ❌ Cleaning Failed
            </h3>
            <div className="detail-grid">
              <div className="detail-field full-width">
                <div className="detail-field-label">Reason</div>
                <div className="detail-field-value">{request.resolutionNote || 'No reason provided'}</div>
              </div>
              {request.resolvedAt && (
                <div className="detail-field">
                  <div className="detail-field-label">Failed At</div>
                  <div className="detail-field-value">{formatDate(request.resolvedAt)}</div>
                </div>
              )}
            </div>
            {request.resolutionPhotoUrl && (
              <div style={{ marginTop: '12px' }}>
                <div className="detail-field-label" style={{ marginBottom: '8px' }}>Proof Photo</div>
                <img src={request.resolutionPhotoUrl} alt="Failure proof" className="failure-photo" />
              </div>
            )}
          </div>
        )}

        {/* Completion Details */}
        {(request.status === 'COMPLETED' || request.status === 'CLOSED') && (
          <div className="card" style={{ marginBottom: '24px', borderColor: 'rgba(52, 211, 153, 0.3)' }}>
            <h3 style={{ color: 'var(--success)', marginBottom: '12px', fontWeight: 700 }}>
              ✅ Cleaning Completed
            </h3>
            <div className="detail-grid">
              {request.resolvedAt && (
                <div className="detail-field">
                  <div className="detail-field-label">Completed At</div>
                  <div className="detail-field-value">{formatDate(request.resolvedAt)}</div>
                </div>
              )}
              {request.studentConfirmedAt && (
                <div className="detail-field">
                  <div className="detail-field-label">You Confirmed At</div>
                  <div className="detail-field-value">{formatDate(request.studentConfirmedAt)}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Re-raised from */}
        {request.parentRequest && (
          <div className="alert alert-info">
            This request was re-raised from a previous failed request (
            <span
              style={{ cursor: 'pointer', textDecoration: 'underline' }}
              onClick={() => navigate(`/student/requests/${request.parentRequest.id}`)}
            >
              view original
            </span>
            )
          </div>
        )}

        {/* Action Buttons */}
        <div className="detail-actions">
          {request.status === 'COMPLETED' && (
            <button
              className="btn btn-success btn-lg"
              onClick={handleClose}
              disabled={actionLoading}
            >
              {actionLoading ? 'Processing...' : '✓ Mark as Done'}
            </button>
          )}

          {request.status === 'FAILED' && (
            <button
              className="btn btn-warning btn-lg"
              onClick={handleReraise}
              disabled={actionLoading}
            >
              {actionLoading ? 'Processing...' : '🔄 Re-raise Request'}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
