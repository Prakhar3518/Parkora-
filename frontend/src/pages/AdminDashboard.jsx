import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api, { errMsg } from '../api/axios';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import Tabs from '../components/Tabs';
import Spinner from '../components/Spinner';
import { fmtDateTime, money } from '../utils';

export default function AdminDashboard() {
  const [tab, setTab] = useState('users');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [listings, setListings] = useState([]);
  const [bookings, setBookings] = useState([]);

  const load = useCallback(async () => {
    try {
      const [s, u, l, b] = await Promise.all([api.get('/admin/dashboard'), api.get('/admin/users'), api.get('/admin/listings'), api.get('/admin/bookings')]);
      setStats(s.data); setUsers(u.data); setListings(l.data); setBookings(b.data);
    } catch (err) { toast.error(errMsg(err)); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const toggle = async (path) => {
    try { await api.put(path); load(); } catch (err) { toast.error(errMsg(err)); }
  };

  if (!stats) return <Spinner />;

  const Table = ({ head, children }) => (
    <div className="card overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr>{head.map((h) => <th key={h} className="p-3">{h}</th>)}</tr></thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );

  return (
    <div>
      <h1 className="mb-4 text-2xl font-extrabold">Admin panel</h1>
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Users" value={stats.totalUsers} hint={`${stats.customers} customers · ${stats.owners} owners`} />
        <StatCard label="Listings" value={stats.totalListings} />
        <StatCard label="Bookings" value={stats.totalBookings} />
        <StatCard label="Revenue" value={money(stats.revenue)} />
      </div>
      <Tabs active={tab} onChange={setTab} tabs={[{ key: 'users', label: 'Users' }, { key: 'listings', label: 'Listings' }, { key: 'bookings', label: 'Bookings' }]} />

      {tab === 'users' && (
        <Table head={['Name', 'Email', 'Role', 'Joined', 'Status', '']}>
          {users.map((u) => (
            <tr key={u.id} className="border-t border-slate-100">
              <td className="p-3 font-medium">{u.name}</td><td className="p-3">{u.email}</td><td className="p-3">{u.role}</td>
              <td className="p-3">{fmtDateTime(u.createdAt)}</td>
              <td className="p-3"><StatusBadge status={u.isActive ? 'ACTIVE' : 'DISABLED'} /></td>
              <td className="p-3">{u.role !== 'ADMIN' && <button className="btn-outline btn-sm" onClick={() => toggle(`/admin/users/${u.id}/toggle`)}>{u.isActive ? 'Disable' : 'Enable'}</button>}</td>
            </tr>
          ))}
        </Table>
      )}
      {tab === 'listings' && (
        <Table head={['Title', 'Owner', 'City', 'Price', 'Status', '']}>
          {listings.map((l) => (
            <tr key={l.id} className="border-t border-slate-100">
              <td className="p-3 font-medium"><Link to={`/parking/${l.id}`} className="hover:text-brand-600">{l.title}</Link></td>
              <td className="p-3">{l.owner?.name}</td><td className="p-3">{l.city}</td><td className="p-3">{money(l.pricePerHour)}/hr</td>
              <td className="p-3"><StatusBadge status={l.isActive ? 'ACTIVE' : 'DISABLED'} /></td>
              <td className="p-3"><button className="btn-outline btn-sm" onClick={() => toggle(`/admin/listings/${l.id}/toggle`)}>{l.isActive ? 'Disable' : 'Enable'}</button></td>
            </tr>
          ))}
        </Table>
      )}
      {tab === 'bookings' && (
        <Table head={['#', 'Listing', 'Customer', 'When', 'Amount', 'Status']}>
          {bookings.map((b) => (
            <tr key={b.id} className="border-t border-slate-100">
              <td className="p-3">{b.id}</td><td className="p-3 font-medium">{b.parkingSpace?.title}</td><td className="p-3">{b.customer?.name}</td>
              <td className="p-3 whitespace-nowrap">{fmtDateTime(b.startTime)}</td><td className="p-3 font-semibold">{money(b.totalAmount)}</td>
              <td className="p-3"><StatusBadge status={b.status} /></td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}
