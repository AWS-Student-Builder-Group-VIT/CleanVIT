export default function StatusBadge({ status }) {
  const statusClass = status?.toLowerCase().replace(' ', '_') || 'pending';
  const label = status?.replace('_', ' ') || 'Pending';

  return (
    <span className={`status-badge ${statusClass}`}>
      {label}
    </span>
  );
}
