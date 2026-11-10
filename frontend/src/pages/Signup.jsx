import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth, homePathFor } from '../context/AuthContext';
import { errMsg } from '../api/axios';

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', role: 'CUSTOMER' });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const payload = { ...form };
      if (!payload.phone) delete payload.phone;
      const user = await signup(payload);
      toast.success('Account created!');
      navigate(homePathFor(user.role), { replace: true });
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="card mx-auto mt-6 max-w-md space-y-4 p-6">
      <h1 className="text-2xl font-extrabold">Create your account</h1>
      <div className="grid grid-cols-2 gap-2">
        {[['CUSTOMER', '🚗 I need parking'], ['OWNER', '🏠 I own parking']].map(([val, label]) => (
          <button
            type="button" key={val} onClick={() => setForm({ ...form, role: val })}
            className={`rounded-lg border px-3 py-3 text-sm font-semibold ${form.role === val ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-slate-300 text-slate-600'}`}
          >{label}</button>
        ))}
      </div>
      <div><label className="label" htmlFor="name">Full name</label><input id="name" required minLength={2} className="input" value={form.name} onChange={set('name')} /></div>
      <div><label className="label" htmlFor="email">Email</label><input id="email" type="email" required className="input" value={form.email} onChange={set('email')} /></div>
      <div><label className="label" htmlFor="phone">Phone (optional)</label><input id="phone" className="input" value={form.phone} onChange={set('phone')} /></div>
      <div><label className="label" htmlFor="password">Password</label><input id="password" type="password" required minLength={6} className="input" value={form.password} onChange={set('password')} /></div>
      <button className="btn-primary w-full" disabled={busy}>{busy ? 'Creating…' : 'Sign up'}</button>
      <p className="text-center text-sm text-slate-500">Already have an account? <Link to="/login" className="font-semibold text-brand-600">Log in</Link></p>
    </form>
  );
}
