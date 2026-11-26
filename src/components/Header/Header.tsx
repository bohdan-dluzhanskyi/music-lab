import { useLocation } from 'react-router-dom';
import { FolderOpen } from 'lucide-react';

import { navigation } from '@/app/navigation';
import { useProjectStore } from '@/stores/project.store';

import './Header.scss';

export default function Header() {
  const { pathname } = useLocation();

  const name = useProjectStore((state) => state.name);
  const setName = useProjectStore((state) => state.setName);

  const currentPage = navigation
    .flatMap((group) => group.items)
    .find((item) => item.path === pathname);

  return (
    <header className="app-header">
      <div className="app-header__location">
        <span>Music Lab</span>
        <span>/</span>
        <strong>{currentPage?.label ?? 'Workspace'}</strong>
      </div>

      <div className="app-header__project">
        <FolderOpen size={16} strokeWidth={1.6} />

        <input
          aria-label="Project name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Untitled Project"
        />
      </div>
    </header>
  );
}
