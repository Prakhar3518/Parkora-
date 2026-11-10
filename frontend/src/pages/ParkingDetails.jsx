import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import api, { errMsg } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import MapView from '../components/MapView';
import Spinner from '../components/Spinner';
import Stars from '../components/Stars';
import { CATEGORY_LABELS, fmtDateTime, hoursBetween, money, toLocalInput } from '../utils';

export default function ParkingDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [space, setSpace] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [fav, setFav] = useState(false);
  const [error, setError] = useState(null);
  const [booking, setBooking] = useState({ startTime: toLocalInput(new Date(Date.now() + 3600000)), endTime: toLocalInput(new Date(Date.now() + 3 * 3600000)), vehicleId: '' });
  const [busy, setBusy] = useState(false);
  const [review, setReview] = useState({ rating: 5, comment: '' });

  const load = useCallback(async () => {
    try {
      const [s, r] = await Promise.all([api.get(`/parking/${id}`), api.get(`/reviews/parking/${id}`)]);
      setSpace(s.data);
      setReviews(r.data);
    } catch (err) {
      setError(errMsg(err));
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!user) return;
    api.get('/vehicles').then((r) => setVehicles(r.data)).catch(() => {});
    api.get('/favorites').then((r) => setFav(r.data.some((x) => String(x.id) === String(id)))).catch(() => {});
  }, [user, id]);

  const hours = useMemo(() => hoursBetween(booking.startTime, booking.endTime), [booking]);
  const isOwnListing = user && space && user.id === space.ownerId;

  if (error) return <div className="card p-10 text-center text-slate-500">{error}</div>;
  if (!space) return <Spinner />;

  const book = async (e) => {
    e.preventDefault();
    if (!user) return navigate('/login', { state: { from: `/parking/${id}` } });
    setBusy(true);
    try {
      await api.post('/bookings', {
        parkingSpaceId: space.id,
        vehicleId: booking.vehicleId || undefined,
        startTime: new Date(booking.startTime).toISOString(),
        endTime: new Date(booking.endTime).toISOString(),
      });
      toast.success('Booking created! Complete payment to confirm it.');
      window.dispatchEvent(new Event('parkora:notifications'));
      navigate('/dashboard');
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  const toggleFav = async () => {
    if (!user) return toast.info('Log in to save favorites');
    try {
      if (fav) await api.delete(`/favorites/${space.id}`); else await api.post(`/favorites/${space.id}`);
      setFav(!fav);
    } catch (err) { toast.error(errMsg(err)); }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    try {
      await api.post('/reviews', { parkingSpaceId: space.id, ...review });
      toast.success('Thanks for your review!');
      setReview({ rating: 5, comment: '' });
      load();
    } catch (err) { toast.error(errMsg(err)); }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <div className="space-y-6">
        <div className="card overflow-hidden">
          {space.images?.length ? (
            <div className="grid grid-cols-2 gap-1">
              {space.images.slice(0, 4).map((src, i) => (
                <img key={src} src={src} alt={`${space.title} ${i + 1}`} className={`h-56 w-full object-cover ${i === 0 && space.images.length === 1 ? 'col-span-2' : ''}`} />
              ))}
            </div>
          ) : (
            <div className="grid h-56 place-items-center bg-gradient-to-br from-brand-100 to-slate-200 text-7xl font-black text-brand-500/40">P</div>
          )}
          <div className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-extrabold">{space.title}</h1>
                <p className="text-slate-500">{space.address}, {space.city}</p>
              </div>
              <button onClick={toggleFav} className="text-2xl" aria-label="Toggle favorite">{fav ? '❤️' : '🤍'}</button>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
              <span className="rounded-full bg-brand-50 px-3 py-1 font-semibold text-brand-700">{CATEGORY_LABELS[space.category]}</span>
              <span>🕒 {space.availableFrom} – {space.availableTo}</span>
              <span>🚗 {space.totalSlots} slot{space.totalSlots > 1 ? 's' : ''}</span>
              <span className="flex items-center gap-1"><Stars value={space.avgRating || 0} /> {space.avgRating ?? 'No ratings yet'} {space.reviewCount ? `(${space.reviewCount})` : ''}</span>
            </div>
            {space.description && <p className="mt-4 whitespace-pre-line text-slate-700">{space.description}</p>}
            <p className="mt-4 text-xs text-slate-400">Hosted by {space.owner?.name}</p>
          </div>
        </div>

        <div className="h-72"><MapView spaces={[space]} link={false} /></div>

        <div className="card p-5">
          <h2 className="mb-3 text-lg font-bold">Reviews</h2>
          {reviews.length === 0 && <p className="text-sm text-slate-500">No reviews yet.</p>}
          <ul className="divide-y divide-slate-100">
            {reviews.map((r) => (
              <li key={r.id} className="py-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{r.customer?.name}</span>
                  <span className="text-xs text-slate-400">{fmtDateTime(r.createdAt)}</span>
                </div>
                <Stars value={r.rating} size="text-sm" />
                {r.comment && <p className="mt-1 text-sm text-slate-700">{r.comment}</p>}
              </li>
            ))}
          </ul>
          {user && !isOwnListing && user.role !== 'ADMIN' && (
            <form onSubmit={submitReview} className="mt-4 space-y-2 border-t border-slate-100 pt-4">
              <div className="text-sm font-semibold">Leave a review <span className="font-normal text-slate-400">(after booking & paying)</span></div>
              <Stars value={review.rating} onChange={(n) => setReview({ ...review, rating: n })} size="text-2xl" />
              <textarea className="input" rows={2} placeholder="Share your experience" value={review.comment} onChange={(e) => setReview({ ...review, comment: e.target.value })} />
              <button className="btn-primary btn-sm">Submit review</button>
            </form>
          )}
        </div>
      </div>

      <aside className="lg:sticky lg:top-20 lg:self-start">
        <form onSubmit={book} className="card space-y-3 p-5">
          <div className="text-2xl font-extrabold text-brand-700">{money(space.pricePerHour)}<span className="text-sm font-normal text-slate-500"> / hour</span></div>
          <div>
            <label className="label">Start</label>
            <input type="datetime-local" required className="input" value={booking.startTime} min={toLocalInput(new Date())} onChange={(e) => setBooking({ ...booking, startTime: e.target.value })} />
          </div>
          <div>
            <label className="label">End</label>
            <input type="datetime-local" required className="input" value={booking.endTime} min={booking.startTime} onChange={(e) => setBooking({ ...booking, endTime: e.target.value })} />
          </div>
          {user && (
            <div>
              <label className="label">Vehicle</label>
              <select className="input" value={booking.vehicleId} onChange={(e) => setBooking({ ...booking, vehicleId: e.target.value })}>
                <option value="">Not specified</option>
                {vehicles.map((v) => <option key={v.id} value={v.id}>{v.plateNumber} ({v.type})</option>)}
              </select>
              {vehicles.length === 0 && <Link to="/dashboard" className="text-xs text-brand-600">Add a vehicle in your dashboard</Link>}
            </div>
          )}
          <div className="flex justify-between border-t border-slate-100 pt-3 text-sm">
            <span>{hours} hour{hours === 1 ? '' : 's'} × {money(space.pricePerHour)}</span>
            <span className="font-bold">{money(hours * space.pricePerHour)}</span>
          </div>
          {isOwnListing ? (
            <p className="text-center text-sm text-slate-500">This is your listing.</p>
          ) : user?.role === 'ADMIN' ? (
            <p className="text-center text-sm text-slate-500">Admins cannot book.</p>
          ) : (
            <button className="btn-primary w-full" disabled={busy || hours < 1}>{busy ? 'Booking…' : user ? 'Reserve' : 'Log in to reserve'}</button>
          )}
          <p className="text-center text-xs text-slate-400">You won't be charged until you pay from your dashboard.</p>
        </form>
      </aside>
    </div>
  );
}
