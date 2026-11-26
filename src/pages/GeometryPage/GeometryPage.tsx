import { useState } from 'react';

import { Clock, Orbit, Shapes, AudioLines, Activity } from 'lucide-react';

import NoteClock from '@/features/geometry/NoteClock';
import SpiralView from '@/features/geometry/SpiralView';
import AngleGenerator from '@/features/geometry/AngleGenerator';
import HarmonicGeometry from '@/features/geometry/HarmonicGeometry';
import LissajousView from '@/features/geometry/LissajousView';

import { useAudioStore } from '@/stores/audio.store';

import './GeometryPage.scss';

const tabs = [
  { id: 'clock', label: 'Note Clock', icon: Clock },
  { id: 'spirals', label: 'Spirals', icon: Orbit },
  { id: 'angles', label: 'Angles', icon: Shapes },
  { id: 'harmonics', label: 'Harmonics', icon: AudioLines },
  { id: 'lissajous', label: 'Lissajous', icon: Activity },
] as const;

type GeometryTab = (typeof tabs)[number]['id'];

export default function GeometryPage() {
  const [activeTab, setActiveTab] = useState<GeometryTab>('clock');

  const [audioError, setAudioError] = useState('');

  const playChord = useAudioStore((state) => state.playChord);

  async function handlePlay(frequencies: number[]) {
    setAudioError('');

    // Keep playback within a practical audible range.
    const playable = frequencies.filter(
      (frequency) => Number.isFinite(frequency) && frequency >= 20 && frequency <= 20000,
    );

    if (!playable.length) {
      setAudioError('Frequency outside playback range');
      return;
    }

    try {
      await playChord(playable, 0.8);
    } catch {
      setAudioError('Unable to initialize audio playback');
    }
  }

  return (
    <section className="geometry-page">
      <header className="geometry-page__header">
        <span>Laboratory</span>

        <h1>Geometry Laboratory</h1>

        <p>
          Explore musical structures through geometry, frequencies and mathematical relationships.
        </p>
      </header>

      <nav className="geometry-page__tabs" aria-label="Geometry modules">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            aria-pressed={activeTab === id}
            className={activeTab === id ? 'is-active' : ''}
            onClick={() => setActiveTab(id)}
          >
            <Icon size={17} />
            {label}
          </button>
        ))}
      </nav>

      {audioError && (
        <p role="alert" className="geometry-error">
          {audioError}
        </p>
      )}

      <div className="geometry-page__content">
        {activeTab === 'clock' && <NoteClock onPlay={handlePlay} />}

        {activeTab === 'spirals' && <SpiralView onPlay={handlePlay} />}

        {activeTab === 'angles' && <AngleGenerator onPlay={handlePlay} />}

        {activeTab === 'harmonics' && <HarmonicGeometry onPlay={handlePlay} />}

        {activeTab === 'lissajous' && <LissajousView onPlay={handlePlay} />}
      </div>
    </section>
  );
}
