export default function Stars({ value = 0, onChange, size = 'text-base' }) {
  return (
    <span className={`inline-flex ${size}`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(n)}
          className={`${n <= Math.round(value) ? 'text-amber-400' : 'text-slate-300'} ${onChange ? 'cursor-pointer' : 'cursor-default'}`}
          aria-label={`${n} star`}
        >★</button>
      ))}
    </span>
  );
}
