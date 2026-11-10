import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api, { errMsg } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import ParkingCard from '../components/ParkingCard';
import MapView from '../components/MapView';
import Spinner from '../components/Spinner';
import { CATEGORY_LABELS } from '../utils';

const EMPTY = { location: '', category: '', maxPrice: '', from: '', to: '', sort: '' };

export default function Home() {
  const { user } = useAuth();
  const [filters, setFilters] = useState(EMPTY);
  const [near, setNear] = useState(null);
  const [spaces, setSpaces] = useState([]);
  const [favIds, setFavIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('split');

  const search = useCallback(async (f = filters, n = near) => {
    setLoading(true);
    try {
      const params = {};
      Object.entries(f).forEach(([k, v]) => { if (v) params[k] = v; });
      if (params.from) params.from = new Date(params.from).toISOString();
      if (params.to) params.to = new Date(params.to).toISOString();
      if (n) Object.assign(params, { nearLat: n.lat, nearLng: n.lng, radiusKm: 15, sort: params.sort || 'distance' });
      const { data } = await api.get('/parking/search', { params });
      setSpaces(data);
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { search(EMPTY, null); }, [search]);

  useEffect(() => {
    if (!user) { setFavIds(new Set()); return; }
    api.get('/favorites').then((r) => setFavIds(new Set(r.data.map((s) => s.id)))).catch(() => {});
  }, [user]);

  const toggleFav = async (id) => {
    if (!user) return toast.info('Log in to save favorites');
    try {
      if (favIds.has(id)) await api.delete(`/favorites/${id}`); else await api.post(`/favorites/${id}`);
      setFavIds((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
    } catch (err) { toast.error(errMsg(err)); }
  };

  const locate = () => {
    if (!navigator.geolocation) return toast.error('Geolocation is not supported');
    navigator.geolocation.getCurrentPosition(
      (pos) => { const n = { lat: pos.coords.latitude, lng: pos.coords.longitude }; setNear(n); search(filters, n); },
      () => toast.error('Could not get your location'),
    );
  };

  const set = (k) => (e) => setFilters({ ...filters, [k]: e.target.value });
  const submit = (e) => { e.preventDefault(); search(filters, near); };
  const reset = () => { setFilters(EMPTY); setNear(null); search(EMPTY, null); };

  return (
    <div>
      <section className="mb-6 rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-500 p-6 text-white">
        <h1 className="text-3xl font-extrabold">Find a parking spot, anywhere.</h1>
        <p className="mt-1 text-indigo-100">Book spaces listed by local owners — like Airbnb, but for parking.</p>
        <form onSubmit={submit} className="mt-4 grid gap-3 rounded-xl bg-white p-4 text-slate-800 sm:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <label className="label">Location</label>
            <input className="input" placeholder="City, area or address" value={filters.location} onChange={set('location')} />
          </div>
          <div>
            <label className="label">Type</label>
            <select className="input" value={filters.category} onChange={set('category')}>
              <option value="">Any</option>
              {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Max ₹/hr</label>
            <input type="number" min="0" className="input" value={filters.maxPrice} onChange={set('maxPrice')} />
          </div>
          <div>
            <label className="label">From</label>
            <input type="datetime-local" className="input" value={filters.from} onChange={set('from')} />
          </div>
          <div>
            <label className="label">To</label>
            <input type="datetime-local" className="input" value={filters.to} onChange={set('to')} />
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:col-span-2 lg:col-span-6">
            <button className="btn-primary">Search</button>
            <button type="button" className="btn-outline" onClick={locate}>{near ? '📍 Near me (on)' : '📍 Near me'}</button>
            <button type="button" className="btn-outline" onClick={reset}>Reset</button>
            <select className="input ml-auto w-auto" value={filters.sort} onChange={(e) => { const f = { ...filters, sort: e.target.value }; setFilters(f); search(f, near); }}>
              <option value="">Newest</option>
              <option value="price_asc">Price: low to high</option>
              <option value="price_desc">Price: high to low</option>
              <option value="rating">Top rated</option>
            </select>
          </div>
        </form>
      </section>

      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm text-slate-500">{loading ? 'Searching…' : `${spaces.length} parking space${spaces.length === 1 ? '' : 's'} found`}</p>
        <div className="flex gap-1">
          {['split', 'list', 'map'].map((v) => (
            <button key={v} onClick={() => setView(v)} className={`btn-sm btn capitalize ${view === v ? 'bg-brand-600 text-white' : 'border border-slate-300 bg-white'}`}>{v}</button>
          ))}
        </div>
      </div>

      {loading ? <Spinner /> : (
        <div className={`grid gap-4 ${view === 'split' ? 'lg:grid-cols-[1fr_1fr]' : ''}`}>
          {view !== 'map' && (
            <div>
              {spaces.length === 0 ? (
                <div className="card p-10 text-center text-slate-500">No parking spaces match your search.</div>
              ) : (
                <div className={`grid gap-4 sm:grid-cols-2 ${view === 'list' ? 'lg:grid-cols-4' : ''}`}>
                  {spaces.map((s) => (
                    <ParkingCard key={s.id} space={s} favorite={favIds.has(s.id)} onToggleFavorite={toggleFav} />
                  ))}
                </div>
              )}
            </div>
          )}
          {view !== 'list' && (
            <div className={`${view === 'split' ? 'sticky top-20 h-[70vh]' : 'h-[70vh]'}`}>
              <MapView spaces={spaces} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
