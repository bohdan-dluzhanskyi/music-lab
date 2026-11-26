import { createHashRouter, Navigate } from 'react-router-dom';

import AppLayout from '@/layouts/AppLayout/AppLayout';

import OverviewPage from '@/pages/OverviewPage/OverviewPage';
import WorkspacePage from '@/pages/WorkspacePage/WorkspacePage';
import SoundPage from '@/pages/SoundPage/SoundPage';
import TheoryPage from '@/pages/TheoryPage/TheoryPage';
import GeometryPage from '@/pages/GeometryPage/GeometryPage';
import MathematicsPage from '@/pages/MathematicsPage/MathematicsPage';
import ComposerPage from '@/pages/ComposerPage/ComposerPage';
import PianoRollPage from '@/pages/PianoRollPage/PianoRollPage';

import { navigation } from './navigation';

const workspaceRoutes = navigation
  .flatMap((group) => group.items)
  .filter(
    (item) =>
      item.path !== '/' &&
      item.path !== '/geometry' &&
      item.path !== '/mathematics' &&
      item.path !== '/composer' &&
      item.path !== '/piano-roll',
  )
  .map((item) => ({
    path: item.path.slice(1),

    element:
      item.path === '/sound' ? (
        <SoundPage />
      ) : item.path === '/theory' ? (
        <TheoryPage />
      ) : (
        <WorkspacePage item={item} />
      ),
  }));

export const router = createHashRouter([
  {
    path: '/',
    element: <AppLayout />,

    children: [
      {
        path: 'composer',
        element: <ComposerPage />,
      },
      {
        path: 'piano-roll',
        element: <PianoRollPage />,
      },
      {
        path: 'mathematics',
        element: <MathematicsPage />,
      },
      {
        path: 'geometry',
        element: <GeometryPage />,
      },
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
