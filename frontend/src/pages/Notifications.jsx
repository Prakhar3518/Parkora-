import { useEffect, useState } from 'react';
import api from '../api/axios';
import Spinner from '../components/Spinner';
import { fmtDateTime } from '../utils';

export default function Notifications() {
  const [data, setData] = useState(null);

  const load = () => api.get('/notifications').then((r) => setData(r.data));
  useEffect(() => { load(); }, []);

  const markAll = async () => { await api.put('/notifications/read-all'); await load(); window.dispatchEvent(new Event('parkora:notifications')); };
  const markOne = async (n) => {
    if (n.isRead) return;
    await api.put(`/notifications/${n.id}/read`);
    await load();
    window.dispatchEvent(new Event('parkora:notifications'));
  };

  if (!data) return <Spinner />;
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">Notifications</h1>
        {data.unreadCount > 0 && <button className="btn-outline btn-sm" onClick={markAll}>Mark all as read</button>}
      </div>
      {data.items.length === 0 ? <div className="card p-10 text-center text-slate-500">You're all caught up.</div> : (
        <ul className="space-y-2">
          {data.items.map((n) => (
            <li key={n.id} onClick={() => markOne(n)} className={`card cursor-pointer p-3 text-sm ${n.isRead ? 'opacity-60' : 'border-brand-500/40 bg-brand-50'}`}>
              <div>{n.message}</div>
              <div className="mt-1 text-xs text-slate-400">{fmtDateTime(n.createdAt)}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
