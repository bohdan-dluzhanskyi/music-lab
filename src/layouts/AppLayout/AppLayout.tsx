import { Outlet } from 'react-router-dom';

import Sidebar from '@/components/Sidebar/Sidebar';
import Header from '@/components/Header/Header';
import Transport from '@/components/Transport/Transport';
import StatusBar from '@/components/StatusBar/StatusBar';

import './AppLayout.scss';

export default function AppLayout() {
  return (
    <div className="app-layout">
      <Sidebar />

      <div className="app-layout__body">
        <Header />

        <main className="app-layout__workspace">
          <Outlet />
        </main>

        <Transport />
        <StatusBar />
      </div>
    </div>
  );
}
