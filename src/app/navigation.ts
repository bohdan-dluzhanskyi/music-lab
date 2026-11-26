import {
  LayoutDashboard,
  Music,
  Piano,
  FileMusic,
  Clock,
  Orbit,
  AudioLines,
  Sigma,
  ChartNoAxesCombined,
  FlaskConical,
  Guitar,
  SlidersHorizontal,
  Settings,
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
        label: 'Note Clock',
        path: '/note-clock',
        icon: Clock,
        description: 'Pitch and frequency geometry',
      },
      {
        label: 'Spirals',
        path: '/spirals',
        icon: Orbit,
        description: 'Musical and mathematical spirals',
      },
      {
        label: 'Harmonics',
        path: '/harmonics',
        icon: AudioLines,
        description: 'Harmonic series and sound spectra',
      },
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
