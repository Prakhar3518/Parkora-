import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth, homePathFor } from '../context/AuthContext';
import api from '../api/axios';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user) return undefined;
    let alive = true;
    const load = () =>
      api.get('/notifications').then((r) => alive && setUnread(r.data.unreadCount)).catch(() => {});
    load();
    const id = setInterval(load, 30000);
    window.addEventListener('parkora:notifications', load);
    return () => { alive = false; clearInterval(id); window.removeEventListener('parkora:notifications', load); };
  }, [user]);

  const linkCls = ({ isActive }) =>
    `text-sm font-medium ${isActive ? 'text-brand-600' : 'text-slate-600 hover:text-slate-900'}`;

  return (
    <header className="sticky top-0 z-[1000] border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2 text-xl font-extrabold text-brand-600">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-white">P</span> Parkora
        </Link>
        <nav className="flex items-center gap-5">
          <NavLink to="/" end className={linkCls}>Find parking</NavLink>
          {user ? (
            <>
              <NavLink to={homePathFor(user.role)} className={linkCls}>Dashboard</NavLink>
              <NavLink to="/notifications" className={linkCls} aria-label="Notifications">
                🔔{unread > 0 && <span className="ml-1 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">{unread}</span>}
              </NavLink>
              <span className="hidden text-sm text-slate-500 sm:inline">Hi, {user.name.split(' ')[0]}</span>
              <button className="btn-outline btn-sm" onClick={() => { logout(); navigate('/'); }}>Log out</button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={linkCls}>Log in</NavLink>
              <Link to="/signup" className="btn-primary btn-sm">Sign up</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
