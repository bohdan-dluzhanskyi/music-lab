import {
  LayoutDashboard,
  Music,
  Music2,
  Piano,
  FileMusic,
  Orbit,
  Sigma,
  ChartNoAxesCombined,
  FlaskConical,
  Guitar,
  SlidersHorizontal,
  Settings,
  AudioWaveform,
} from 'lucide-react';

import type { LucideIcon } from 'lucide-react';

export interface NavigationItem {
  label: string;
  path: string;
  icon: LucideIcon;
  description: string;
}

export interface NavigationGroup {
  title: string;
  items: NavigationItem[];
}

export const navigation: NavigationGroup[] = [
  {
    title: 'Workspace',
    items: [
      {
        label: 'Overview',
        path: '/',
        icon: LayoutDashboard,
        description: 'Project overview',
      },
      {
        label: 'Composer',
        path: '/composer',
        icon: Music,
        description: 'Create musical compositions',
      },
      {
        label: 'Piano Roll',
        path: '/piano-roll',
        icon: Piano,
        description: 'Edit notes and musical events',
      },
      {
        label: 'Notation',
        path: '/notation',
        icon: FileMusic,
        description: 'Scores and tablatures',
      },
    ],
  },
  {
    title: 'Laboratory',
    items: [
      {
        label: 'Mathematics',
        path: '/mathematics',
        icon: Sigma,
        description: 'Mathematical music generators',
      },
      {
        label: 'Analyzer',
        path: '/analyzer',
        icon: ChartNoAxesCombined,
        description: 'Analyze musical compositions',
      },
      {
        label: 'Sound Laboratory',
        path: '/sound',
        icon: AudioWaveform,
        description: 'Sound synthesis and frequency experiments',
      },
      {
        label: 'Theory Laboratory',
        path: '/theory',
        icon: Music2,
        description: 'Scales, chords and musical harmony',
      },
      {
        label: 'Geometry Laboratory',
        path: '/geometry',
        icon: Orbit,
        description: 'Explore musical geometry and mathematical relationships',
      },
      {
        label: 'Experiments',
        path: '/experiments',
        icon: FlaskConical,
        description: 'Compare musical models',
      },
    ],
  },
  {
    title: 'Audio',
    items: [
      {
        label: 'Instruments',
        path: '/instruments',
        icon: Guitar,
        description: 'Musical instrument library',
      },
      {
        label: 'Mixer',
        path: '/mixer',
        icon: SlidersHorizontal,
        description: 'Audio mixing and effects',
      },
    ],
  },
  {
    title: 'System',
    items: [
      {
        label: 'Settings',
        path: '/settings',
        icon: Settings,
        description: 'Application preferences',
      },
    ],
  },
];
