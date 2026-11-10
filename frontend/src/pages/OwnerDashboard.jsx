import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api, { errMsg } from '../api/axios';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import Tabs from '../components/Tabs';
import Spinner from '../components/Spinner';
import { CATEGORY_LABELS, fmtDateTime, money } from '../utils';

export default function OwnerDashboard() {
  const [tab, setTab] = useState('listings');
  const [stats, setStats] = useState(null);
  const [listings, setListings] = useState(null);
  const [bookings, setBookings] = useState([]);

  const load = useCallback(async () => {
    try {
      const [s, l, b] = await Promise.all([api.get('/owner/dashboard'), api.get('/parking/my'), api.get('/bookings/owner')]);
      setStats(s.data); setListings(l.data); setBookings(b.data);
    } catch (err) { toast.error(errMsg(err)); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const togglePause = async (l) => {
    try { await api.put(`/parking/${l.id}`, { isActive: !l.isActive }); toast.success(l.isActive ? 'Listing paused' : 'Listing is live'); load(); }
    catch (err) { toast.error(errMsg(err)); }
  };
  const remove = async (l) => {
    if (!window.confirm(`Delete "${l.title}"?`)) return;
    try { await api.delete(`/parking/${l.id}`); toast.success('Listing deleted'); load(); }
    catch (err) { toast.error(errMsg(err)); }
  };

  if (!stats || !listings) return <Spinner />;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">Owner dashboard</h1>
        <Link to="/owner/listings/new" className="btn-primary">+ New listing</Link>
      </div>
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Listings" value={stats.totalListings} />
        <StatCard label="Bookings" value={stats.totalBookings} hint={`${stats.pendingBookings} pending payment`} />
        <StatCard label="Confirmed" value={stats.confirmedBookings} />
        <StatCard label="Earnings" value={money(stats.earnings)} />
      </div>

      <Tabs active={tab} onChange={setTab} tabs={[{ key: 'listings', label: 'My listings' }, { key: 'bookings', label: 'Bookings received' }]} />

      {tab === 'listings' && (
        listings.length === 0 ? (
          <div className="card p-10 text-center text-slate-500">You haven't listed any parking yet. <Link to="/owner/listings/new" className="font-semibold text-brand-600">Create your first listing</Link></div>
        ) : (
          <div className="space-y-3">
            {listings.map((l) => (
              <div key={l.id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <Link to={`/parking/${l.id}`} className="font-semibold hover:text-brand-600">{l.title}</Link>
                  <div className="text-xs text-slate-500">{l.address}, {l.city}</div>
                  <div className="mt-1 text-xs text-slate-500">{CATEGORY_LABELS[l.category]} · {l.totalSlots} slot(s) · {l.availableFrom}–{l.availableTo} · ★ {l.avgRating ?? '—'}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold">{money(l.pricePerHour)}/hr</span>
                  <StatusBadge status={l.isActive ? 'ACTIVE' : 'DISABLED'} />
                  <button className="btn-outline btn-sm" onClick={() => togglePause(l)}>{l.isActive ? 'Pause' : 'Resume'}</button>
                  <Link className="btn-outline btn-sm" to={`/owner/listings/${l.id}/edit`}>Edit</Link>
                  <button className="btn-danger btn-sm" onClick={() => remove(l)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {tab === 'bookings' && (
        bookings.length === 0 ? <div className="card p-10 text-center text-slate-500">No bookings received yet.</div> : (
          <div className="card overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-3">Listing</th><th className="p-3">Customer</th><th className="p-3">When</th><th className="p-3">Amount</th><th className="p-3">Status</th></tr></thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id} className="border-t border-slate-100">
                    <td className="p-3 font-medium">{b.parkingSpace.title}</td>
                    <td className="p-3">{b.customer.name}<div className="text-xs text-slate-400">{b.customer.phone || b.customer.email}{b.vehicle ? ` · ${b.vehicle.plateNumber}` : ''}</div></td>
                    <td className="p-3 whitespace-nowrap">{fmtDateTime(b.startTime)}<div className="text-xs text-slate-400">to {fmtDateTime(b.endTime)}</div></td>
                    <td className="p-3 font-semibold">{money(b.totalAmount)}</td>
                    <td className="p-3"><StatusBadge status={b.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}
