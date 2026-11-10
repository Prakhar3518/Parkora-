import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api, { errMsg } from '../api/axios';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import Tabs from '../components/Tabs';
import Spinner from '../components/Spinner';
import ParkingCard from '../components/ParkingCard';
import { fmtDateTime, money } from '../utils';

const notify = () => window.dispatchEvent(new Event('parkora:notifications'));

export default function CustomerDashboard() {
  const [tab, setTab] = useState('bookings');
  const [stats, setStats] = useState(null);
  const [bookings, setBookings] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [payments, setPayments] = useState([]);
  const [vehicle, setVehicle] = useState({ plateNumber: '', type: 'CAR', model: '' });

  const load = useCallback(async () => {
    try {
      const [s, b, f, v, p] = await Promise.all([
        api.get('/customer/dashboard'), api.get('/bookings/my'), api.get('/favorites'), api.get('/vehicles'), api.get('/payments/my'),
      ]);
      setStats(s.data); setBookings(b.data); setFavorites(f.data); setVehicles(v.data); setPayments(p.data);
    } catch (err) { toast.error(errMsg(err)); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const act = async (fn, okMsg) => {
    try { await fn(); toast.success(okMsg); await load(); notify(); } catch (err) { toast.error(errMsg(err)); }
  };

  const addVehicle = (e) => {
    e.preventDefault();
    act(async () => { await api.post('/vehicles', { ...vehicle, model: vehicle.model || undefined }); setVehicle({ plateNumber: '', type: 'CAR', model: '' }); }, 'Vehicle added');
  };

  if (!bookings || !stats) return <Spinner />;

  return (
    <div>
      <h1 className="mb-4 text-2xl font-extrabold">My dashboard</h1>
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total bookings" value={stats.totalBookings} />
        <StatCard label="Upcoming" value={stats.upcomingBookings} />
        <StatCard label="Favorites" value={stats.favorites} />
        <StatCard label="Total spent" value={money(stats.totalSpent)} />
      </div>

      <Tabs
        active={tab} onChange={setTab}
        tabs={[{ key: 'bookings', label: 'Bookings' }, { key: 'favorites', label: 'Favorites' }, { key: 'vehicles', label: 'Vehicles' }, { key: 'payments', label: 'Payments' }]}
      />

      {tab === 'bookings' && (
        bookings.length === 0 ? (
          <div className="card p-10 text-center text-slate-500">No bookings yet. <Link to="/" className="font-semibold text-brand-600">Find parking</Link></div>
        ) : (
          <div className="space-y-3">
            {bookings.map((b) => (
              <div key={b.id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <Link to={`/parking/${b.parkingSpace.id}`} className="font-semibold hover:text-brand-600">{b.parkingSpace.title}</Link>
                  <div className="text-xs text-slate-500">{b.parkingSpace.address}</div>
                  <div className="mt-1 text-sm">{fmtDateTime(b.startTime)} → {fmtDateTime(b.endTime)}</div>
                  {b.vehicle && <div className="text-xs text-slate-500">🚗 {b.vehicle.plateNumber}</div>}
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="font-bold">{money(b.totalAmount)}</div>
                    <StatusBadge status={b.status} />
                  </div>
                  {b.status === 'PENDING' && <button className="btn-primary btn-sm" onClick={() => act(() => api.post(`/payments/pay-now/${b.id}`), 'Payment successful — booking confirmed')}>Pay now</button>}
                  {['PENDING', 'CONFIRMED'].includes(b.status) && new Date(b.startTime) > new Date() && (
                    <button className="btn-outline btn-sm" onClick={() => window.confirm('Cancel this booking?') && act(() => api.put(`/bookings/${b.id}/cancel`), 'Booking cancelled')}>Cancel</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {tab === 'favorites' && (
        favorites.length === 0 ? <div className="card p-10 text-center text-slate-500">No favorites saved yet.</div> : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {favorites.map((s) => <ParkingCard key={s.id} space={s} favorite onToggleFavorite={(id) => act(() => api.delete(`/favorites/${id}`), 'Removed from favorites')} />)}
          </div>
        )
      )}

      {tab === 'vehicles' && (
        <div className="grid gap-4 md:grid-cols-[1fr_320px]">
          <div className="space-y-2">
            {vehicles.length === 0 && <div className="card p-6 text-center text-slate-500">No vehicles added.</div>}
            {vehicles.map((v) => (
              <div key={v.id} className="card flex items-center justify-between p-3">
                <div><div className="font-semibold">{v.plateNumber}</div><div className="text-xs text-slate-500">{v.type}{v.model ? ` · ${v.model}` : ''}</div></div>
                <button className="btn-outline btn-sm" onClick={() => act(() => api.delete(`/vehicles/${v.id}`), 'Vehicle removed')}>Remove</button>
              </div>
            ))}
          </div>
          <form onSubmit={addVehicle} className="card h-fit space-y-3 p-4">
            <div className="font-semibold">Add vehicle</div>
            <input className="input" required placeholder="Plate number" value={vehicle.plateNumber} onChange={(e) => setVehicle({ ...vehicle, plateNumber: e.target.value })} />
            <select className="input" value={vehicle.type} onChange={(e) => setVehicle({ ...vehicle, type: e.target.value })}>
              {['CAR', 'BIKE', 'SUV', 'EV', 'TRUCK'].map((t) => <option key={t}>{t}</option>)}
            </select>
            <input className="input" placeholder="Model (optional)" value={vehicle.model} onChange={(e) => setVehicle({ ...vehicle, model: e.target.value })} />
            <button className="btn-primary w-full">Add</button>
          </form>
        </div>
      )}

      {tab === 'payments' && (
        payments.length === 0 ? <div className="card p-10 text-center text-slate-500">No payments yet.</div> : (
          <div className="card overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-3">Date</th><th className="p-3">Parking</th><th className="p-3">Amount</th><th className="p-3">Txn ID</th><th className="p-3">Status</th></tr></thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-t border-slate-100">
                    <td className="p-3">{fmtDateTime(p.createdAt)}</td>
                    <td className="p-3">{p.booking?.parkingSpace?.title}</td>
                    <td className="p-3 font-semibold">{money(p.amount)}</td>
                    <td className="p-3 font-mono text-xs">{p.transactionId}</td>
                    <td className="p-3"><StatusBadge status={p.status} /></td>
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
