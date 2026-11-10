import { Link } from 'react-router-dom';
import { CATEGORY_LABELS, money } from '../utils';
import Stars from './Stars';

export default function ParkingCard({ space, favorite, onToggleFavorite }) {
  const img = space.images?.[0];
  return (
    <div className="card overflow-hidden transition hover:shadow-md">
      <Link to={`/parking/${space.id}`}>
        <div className="relative h-36 bg-gradient-to-br from-brand-100 to-slate-200">
          {img ? (
            <img src={img} alt={space.title} className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <div className="grid h-full place-items-center text-5xl font-black text-brand-500/40">P</div>
          )}
          <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-xs font-semibold text-slate-700">
            {CATEGORY_LABELS[space.category]}
          </span>
        </div>
      </Link>
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <Link to={`/parking/${space.id}`} className="line-clamp-1 font-semibold text-slate-900 hover:text-brand-600">{space.title}</Link>
          {onToggleFavorite && (
            <button onClick={() => onToggleFavorite(space.id)} className="text-lg leading-none" aria-label="Toggle favorite">
              {favorite ? '❤️' : '🤍'}
            </button>
          )}
        </div>
        <div className="line-clamp-1 text-xs text-slate-500">{space.address}</div>
        <div className="mt-2 flex items-center justify-between">
          <div className="text-sm font-bold text-brand-700">{money(space.pricePerHour)}<span className="font-normal text-slate-500">/hr</span></div>
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <Stars value={space.avgRating || 0} size="text-xs" />
            {space.reviewCount ? `(${space.reviewCount})` : 'New'}
          </div>
        </div>
        {space.distanceKm != null && <div className="mt-1 text-xs text-slate-400">{space.distanceKm} km away</div>}
      </div>
    </div>
  );
}
