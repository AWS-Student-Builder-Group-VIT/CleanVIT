import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { requestsAPI, usersAPI } from '../../services/api';
import Navbar from '../../components/Navbar';
import StatusBadge from '../../components/StatusBadge';

const STATUS_FILTERS = ['ALL', 'PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'CLOSED'];

export default function SupervisorDashboard() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [alert, setAlert] = useState(null);
  const [assigningId, setAssigningId] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const [reqRes, staffRes] = await Promise.all([
        requestsAPI.getAll(),
        usersAPI.getStaff(user.blockId),
      ]);
      setRequests(reqRes.data);
      setStaff(staffRes.data);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  }, [user.blockId]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleAssign = async (requestId, staffId) => {
    if (!staffId) return;
    setAssigningId(requestId);
    try {
      await requestsAPI.assign(requestId, staffId);
      setAlert({ type: 'success', message: 'Staff assigned successfully!' });
      fetchData();
      setTimeout(() => setAlert(null), 3000);
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.error || 'Assignment failed' });
    } finally {
      setAssigningId(null);
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

  const filteredRequests = filter === 'ALL'
    ? requests
    : requests.filter((r) => r.status === filter);

  // Count by status
  const counts = {};
  STATUS_FILTERS.forEach((s) => {
    counts[s] = s === 'ALL' ? requests.length : requests.filter((r) => r.status === s).length;
  });

  return (
    <>
      <Navbar />
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Supervisor Dashboard</h1>
          <p className="page-subtitle">{user?.blockName || 'Block'} — Managing {requests.length} request(s)</p>
        </div>

        {alert && <div className={`alert alert-${alert.type}`}>{alert.message}</div>}

        {/* Stats Row */}
        <div className="stats-row">
          <div className="stat-card total">
            <div className="stat-value">{counts.ALL}</div>
            <div className="stat-label">Total</div>
          </div>
          <div className="stat-card pending">
            <div className="stat-value">{counts.PENDING}</div>
            <div className="stat-label">Pending</div>
          </div>
          <div className="stat-card assigned">
            <div className="stat-value">{counts.ASSIGNED + counts.IN_PROGRESS}</div>
            <div className="stat-label">In Progress</div>
          </div>
          <div className="stat-card completed">
            <div className="stat-value">{counts.COMPLETED + counts.CLOSED}</div>
            <div className="stat-label">Done</div>
          </div>
          <div className="stat-card failed">
            <div className="stat-value">{counts.FAILED}</div>
            <div className="stat-label">Failed</div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="filter-bar">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              className={`filter-btn ${filter === s ? 'active' : ''}`}
              onClick={() => setFilter(s)}
            >
              {s.replace('_', ' ')} ({counts[s]})
            </button>
          ))}
        </div>

        {loading ? (
          <div className="spinner-container"><div className="spinner"></div></div>
        ) : filteredRequests.length === 0 ? (
          <div className="empty-state card">
            <div className="empty-state-icon">📋</div>
            <div className="empty-state-title">No requests found</div>
            <div className="empty-state-text">
              {filter === 'ALL' ? 'No requests in your block yet' : `No ${filter.toLowerCase().replace('_', ' ')} requests`}
            </div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="requests-table">
              <thead>
                <tr>
                  <th>Room</th>
                  <th>Student</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Raised</th>
                  <th>Assign Staff</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((req) => (
                  <tr key={req.id}>
                    <td style={{ fontWeight: 700 }}>{req.roomNo}</td>
                    <td>
                      <div>{req.student?.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{req.student?.regNo}</div>
                    </td>
                    <td>{req.cleaningType}</td>
                    <td><StatusBadge status={req.status} /></td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{formatDate(req.createdAt)}</td>
                    <td>
                      {['PENDING', 'ASSIGNED'].includes(req.status) ? (
                        <select
                          className="assign-select"
                          value={req.assignedStaffId || ''}
                          onChange={(e) => handleAssign(req.id, e.target.value)}
                          disabled={assigningId === req.id}
                        >
                          <option value="">— Assign —</option>
                          {staff.map((s) => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                      ) : req.assignedStaff ? (
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                          {req.assignedStaff.name}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
