import { NavLink } from 'react-router-dom';
import { AudioWaveform } from 'lucide-react';

import { navigation } from '@/app/navigation';

import './Sidebar.scss';

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <AudioWaveform size={26} />
        <span>Music Lab</span>
      </div>

      <nav className="sidebar__navigation" aria-label="Main navigation">
        {navigation.map((group) => (
          <div className="sidebar__group" key={group.title}>
            <h2 className="sidebar__group-title">{group.title}</h2>

            {group.items.map(({ label, path, icon: Icon }) => (
              <NavLink
                key={path}
                to={path}
                end={path === '/'}
                className={({ isActive }) =>
                  `sidebar__link${isActive ? ' sidebar__link--active' : ''}`
                }
              >
                <Icon size={17} strokeWidth={1.6} />
                <span>{label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar__footer">Music Lab · v0.1.0</div>
    </aside>
  );
}
