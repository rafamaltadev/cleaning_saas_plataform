import { NavLink } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Início', icon: '🏠' },
  { to: '/quotes', label: 'Orçamentos', icon: '📋' },
  { to: '/bookings', label: 'Agendamentos', icon: '📅' },
  { to: '/clients', label: 'Clientes', icon: '👥' },
  { to: '/settings', label: 'Configurações', icon: '⚙️' },
];

export default function BottomNav() {
  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-surface border-t border-border flex items-center justify-around z-30"
      aria-label="Bottom navigation"
    >
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 px-3 min-h-[44px] justify-center transition-all duration-200
            ${isActive ? 'text-primary' : 'text-text-muted hover:text-text-primary'}`
          }
        >
          <span className="text-xl">{item.icon}</span>
          <span className="text-xs font-medium">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
