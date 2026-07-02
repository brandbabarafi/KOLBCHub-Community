import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Home, Bookmark, Ticket, CreditCard, User, Trophy } from 'lucide-react';

export default function MobileLayout() {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/campaigns', icon: Bookmark, label: 'Campaign' },
    { path: '/leaderboard', icon: Trophy, label: 'Ranking' },
    { path: '/voucher', icon: Ticket, label: 'Voucher' },
    { path: '/payment', icon: CreditCard, label: 'Payment' },
    { path: '/profile', icon: User, label: 'Profil' },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col max-w-md mx-auto border-x border-neutral-200 shadow-lg relative pb-20 font-sans">

      {/* HEADER — disembunyikan di Home */}
      {!isHome && (
        <header className="bg-white border-b border-neutral-100 px-4 py-2.5 sticky top-0 z-40 flex items-center gap-2">
          <img
            src="/logo.png"
            alt="Logo"
            className="h-7 w-auto object-contain shrink-0"
            onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
          />
          <div className="truncate">
            <p className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider leading-none">Brand Community</p>
            <h2 className="text-xs font-bold text-accent truncate mt-0.5">
              {user?.name || 'Member'}
            </h2>
          </div>
        </header>
      )}

      {/* AREA KONTEN */}
      <main className={isHome ? 'flex-1' : 'p-4 flex-1'}>
        <Outlet />
      </main>

      {/* BOTTOM NAVIGATION BAR */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-neutral-200 px-2 py-2 flex justify-around items-center z-40 shadow-xl">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
                  isActive
                    ? 'text-primary font-bold text-[11px] scale-105'
                    : 'text-neutral-400 hover:text-neutral-600 text-[11px]'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
