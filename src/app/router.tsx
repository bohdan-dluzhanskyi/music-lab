import { createHashRouter, Navigate } from 'react-router-dom';

import AppLayout from '@/layouts/AppLayout/AppLayout';
import OverviewPage from '@/pages/OverviewPage/OverviewPage';
import WorkspacePage from '@/pages/WorkspacePage/WorkspacePage';

import { navigation } from './navigation';

const workspaceRoutes = navigation
  .flatMap((group) => group.items)
  .filter((item) => item.path !== '/')
  .map((item) => ({
    path: item.path.slice(1),
    element: <WorkspacePage item={item} />,
  }));

export const router = createHashRouter([
  {
    path: '/',
    element: <AppLayout />,

    children: [
      {
        index: true,
        element: <OverviewPage />,
      },

      ...workspaceRoutes,

      {
        path: '*',
        element: <Navigate to="/" replace />,
      },
    ],
  },
]);
