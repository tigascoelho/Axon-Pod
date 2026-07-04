import { NavLink } from 'react-router-dom';

const links = [
  { to: '/',          label: 'Home',      icon: HomeIcon     },
  { to: '/training',  label: 'Training',  icon: TrainingIcon },
  { to: '/sessions',  label: 'Sessions',  icon: SessionsIcon },
  { to: '/progress',  label: 'Progress',  icon: ProgressIcon },
  { to: '/profile',   label: 'Profile',   icon: ProfileIcon  },
];

export default function BottomNav() {
  return (
    <nav
      id="bottom-nav"
      className="fixed bottom-0 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg bottom-nav"
      style={{
        background: 'rgba(8, 8, 10, 0.88)',
        borderTop: '1px solid rgba(38, 38, 48, 0.6)',
      }}
    >
      <div className="flex items-stretch justify-around">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `relative flex flex-col items-center gap-1 pt-3 pb-2.5 px-1 flex-1 transition-all duration-200 ${
                isActive ? 'text-accent' : 'text-text-muted'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-accent"
                    style={{ boxShadow: '0 0 8px rgba(0,230,118,0.5)' }}
                  />
                )}
                <Icon active={isActive} />
                <span
                  className={`text-[9px] font-semibold tracking-wide ${
                    isActive ? 'text-accent' : 'text-text-muted'
                  }`}
                >
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

/* ── Icons — 22×22 for better touch targets ── */

function HomeIcon({ active }) {
  const c = active ? '#00E676' : '#6b6b7b';
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M3 10.5L12 3L21 10.5V20C21 20.55 20.55 21 20 21H15V15H9V21H4C3.45 21 3 20.55 3 20V10.5Z"
        fill={active ? 'rgba(0,230,118,0.15)' : 'none'}
        stroke={c}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TrainingIcon({ active }) {
  const c = active ? '#00E676' : '#6b6b7b';
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke={c} strokeWidth="1.8" fill={active ? 'rgba(0,230,118,0.1)' : 'none'} />
      <polygon points="10,8 16,12 10,16" fill={c} />
    </svg>
  );
}

function SessionsIcon({ active }) {
  const c = active ? '#00E676' : '#6b6b7b';
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="4" width="18" height="4" rx="2" fill={active ? c : 'none'} stroke={c} strokeWidth="1.5" fillOpacity={active ? 0.2 : 0} />
      <rect x="3" y="10" width="18" height="4" rx="2" fill={active ? c : 'none'} stroke={c} strokeWidth="1.5" fillOpacity={active ? 0.15 : 0} />
      <rect x="3" y="16" width="12" height="4" rx="2" fill={active ? c : 'none'} stroke={c} strokeWidth="1.5" fillOpacity={active ? 0.1 : 0} />
    </svg>
  );
}

function ProgressIcon({ active }) {
  const c = active ? '#00E676' : '#6b6b7b';
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <polyline
        points="3 17 8 11 13 14 21 6"
        stroke={c}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polyline
        points="17 6 21 6 21 10"
        stroke={c}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ProfileIcon({ active }) {
  const c = active ? '#00E676' : '#6b6b7b';
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle
        cx="12" cy="8" r="4"
        stroke={c}
        strokeWidth="1.8"
        fill={active ? 'rgba(0,230,118,0.15)' : 'none'}
      />
      <path
        d="M4 20C4 16.686 7.582 14 12 14C16.418 14 20 16.686 20 20"
        stroke={c}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
