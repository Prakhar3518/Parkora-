import { Link } from 'react-router-dom';
export default function NotFound() {
  return (
    <div className="py-24 text-center">
      <div className="text-6xl font-black text-brand-500">404</div>
      <p className="mt-2 text-slate-500">That page doesn't exist.</p>
      <Link to="/" className="btn-primary mt-4">Back to home</Link>
    </div>
  );
}
