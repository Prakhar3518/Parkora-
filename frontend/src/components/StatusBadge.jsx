const COLORS = {
  PENDING: 'bg-amber-100 text-amber-800',
  CONFIRMED: 'bg-emerald-100 text-emerald-800',
  COMPLETED: 'bg-sky-100 text-sky-800',
  CANCELLED: 'bg-slate-200 text-slate-600',
  SUCCESS: 'bg-emerald-100 text-emerald-800',
  REFUNDED: 'bg-purple-100 text-purple-800',
  FAILED: 'bg-red-100 text-red-800',
  ACTIVE: 'bg-emerald-100 text-emerald-800',
  DISABLED: 'bg-red-100 text-red-800',
};
export default function StatusBadge({ status }) {
  return <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${COLORS[status] || 'bg-slate-100'}`}>{status}</span>;
}
