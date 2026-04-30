import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { logout } from '../../store/slices/authSlice';
import { REFRESH_TOKEN_KEY } from '../../api/client';

const NAV_ITEMS = [
  { to: '/kanban', label: 'Kanban', icon: '⬜' },
  { to: '/clients', label: 'Clients', icon: '👥' },
  { to: '/settings', label: 'Settings', icon: '⚙️' },
];

export default function Sidebar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);

  function handleLogout() {
    dispatch(logout());
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    navigate('/login');
  }

  return (
    <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-full w-sidebar bg-surface border-r border-border z-30">
      <div className="flex items-center gap-3 px-6 h-header border-b border-border">
        <span className="text-primary font-bold text-lg">CleanSaaS</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1" aria-label="Main navigation">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded text-sm font-medium transition-all duration-200
              ${isActive
                ? 'bg-primary/20 text-primary'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-alt'
              }`
            }
          >
            <span>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 pb-4 border-t border-border pt-4">
        {user && (
          <div className="px-3 py-2 mb-2">
            <p className="text-xs text-text-muted">Logged in as</p>
            <p className="text-sm text-text-primary font-medium truncate">{user.email}</p>
            <p className="text-xs text-text-secondary capitalize">{user.role.replace('_', ' ')}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded text-sm font-medium text-text-secondary hover:text-error hover:bg-error/10 transition-all duration-200"
        >
          <span>🚪</span> Sign out
        </button>
      </div>
    </aside>
  );
}
