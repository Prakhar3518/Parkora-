import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import api, { errMsg } from '../api/axios';
import { LocationPicker } from '../components/MapView';
import Spinner from '../components/Spinner';
import { CATEGORY_LABELS } from '../utils';

const EMPTY = {
  title: '', description: '', address: '', city: '', latitude: '', longitude: '', pricePerHour: '',
  category: 'OPEN', availableFrom: '00:00', availableTo: '23:59', totalSlots: 1, images: '',
};

export default function ListingForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(editing);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!editing) return;
    api.get(`/parking/${id}`)
      .then(({ data }) => setForm({ ...EMPTY, ...data, description: data.description || '', images: (data.images || []).join('\n') }))
      .catch((err) => { toast.error(errMsg(err)); navigate('/owner'); })
      .finally(() => setLoading(false));
  }, [id, editing, navigate]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (form.latitude === '' || form.longitude === '') return toast.error('Click the map to set the location');
    setBusy(true);
    const payload = {
      title: form.title, description: form.description || undefined, address: form.address, city: form.city,
      latitude: Number(form.latitude), longitude: Number(form.longitude), pricePerHour: Number(form.pricePerHour),
      category: form.category, availableFrom: form.availableFrom, availableTo: form.availableTo, totalSlots: Number(form.totalSlots),
      images: form.images.split('\n').map((s) => s.trim()).filter(Boolean),
    };
    try {
      if (editing) await api.put(`/parking/${id}`, payload); else await api.post('/parking', payload);
      toast.success(editing ? 'Listing updated' : 'Listing created');
      navigate('/owner');
    } catch (err) { toast.error(errMsg(err)); } finally { setBusy(false); }
  };

  const useMyLocation = () => navigator.geolocation?.getCurrentPosition(
    (p) => setForm((f) => ({ ...f, latitude: +p.coords.latitude.toFixed(6), longitude: +p.coords.longitude.toFixed(6) })),
    () => toast.error('Could not get your location'),
  );

  if (loading) return <Spinner />;

  return (
    <form onSubmit={submit} className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-2xl font-extrabold">{editing ? 'Edit listing' : 'New listing'}</h1>
      <div className="card grid gap-4 p-5 sm:grid-cols-2">
        <div className="sm:col-span-2"><label className="label">Title</label><input required minLength={3} className="input" value={form.title} onChange={set('title')} /></div>
        <div className="sm:col-span-2"><label className="label">Description</label><textarea rows={3} className="input" value={form.description} onChange={set('description')} /></div>
        <div><label className="label">Address</label><input required className="input" value={form.address} onChange={set('address')} /></div>
        <div><label className="label">City</label><input required className="input" value={form.city} onChange={set('city')} /></div>
        <div><label className="label">Price per hour (₹)</label><input required type="number" min="1" step="any" className="input" value={form.pricePerHour} onChange={set('pricePerHour')} /></div>
        <div><label className="label">Type</label>
          <select className="input" value={form.category} onChange={set('category')}>{Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        </div>
        <div><label className="label">Available from</label><input type="time" required className="input" value={form.availableFrom} onChange={set('availableFrom')} /></div>
        <div><label className="label">Available until</label><input type="time" required className="input" value={form.availableTo} onChange={set('availableTo')} /></div>
        <div><label className="label">Number of slots</label><input type="number" min="1" required className="input" value={form.totalSlots} onChange={set('totalSlots')} /></div>
        <div className="sm:col-span-2">
          <label className="label">Photo URLs (one per line, max 5)</label>
          <textarea rows={3} className="input" placeholder="https://res.cloudinary.com/…" value={form.images} onChange={set('images')} />
          <p className="mt-1 text-xs text-slate-400">Direct image uploads (Cloudinary) are on the roadmap — paste image links for now.</p>
        </div>
      </div>
      <div className="card space-y-3 p-5">
        <div className="flex items-center justify-between">
          <div><div className="font-semibold">Location</div><div className="text-xs text-slate-500">Click the map to drop a pin.</div></div>
          <button type="button" className="btn-outline btn-sm" onClick={useMyLocation}>📍 Use my location</button>
        </div>
        <LocationPicker lat={form.latitude} lng={form.longitude} onPick={(lat, lng) => setForm((f) => ({ ...f, latitude: +lat.toFixed(6), longitude: +lng.toFixed(6) }))} />
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Latitude</label><input className="input" type="number" step="any" value={form.latitude} onChange={set('latitude')} /></div>
          <div><label className="label">Longitude</label><input className="input" type="number" step="any" value={form.longitude} onChange={set('longitude')} /></div>
        </div>
      </div>
      <div className="flex gap-2">
        <button className="btn-primary" disabled={busy}>{busy ? 'Saving…' : editing ? 'Save changes' : 'Create listing'}</button>
        <button type="button" className="btn-outline" onClick={() => navigate('/owner')}>Cancel</button>
      </div>
    </form>
  );
}
