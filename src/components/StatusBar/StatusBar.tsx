import { useProjectStore } from '@/stores/project.store';
import { useAudioStore } from '@/stores/audio.store';

import './StatusBar.scss';

export default function StatusBar() {
  const frequency = useProjectStore((state) => state.referenceFrequency);

  const status = useAudioStore((state) => state.status);

  return (
    <footer className="status-bar">
      <div className="status-bar__status">
        <span className="status-bar__indicator" />

        <span>{status === 'error' ? 'Audio error' : 'Ready'}</span>
      </div>

      <div className="status-bar__info">
        <span>12-TET</span>

        <span>Reference: {frequency} Hz</span>

        <span>Audio engine: {status}</span>
      </div>
    </footer>
  );
}
