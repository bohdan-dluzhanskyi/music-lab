import { useProjectStore } from '@/stores/project.store';

import './StatusBar.scss';

export default function StatusBar() {
  const frequency = useProjectStore((state) => state.referenceFrequency);

  return (
    <footer className="status-bar">
      <div className="status-bar__status">
        <span className="status-bar__indicator" />
        <span>Ready</span>
      </div>

      <div className="status-bar__info">
        <span>12-TET</span>
        <span>A4 = {frequency} Hz</span>
        <span>Audio engine: Offline</span>
      </div>
    </footer>
  );
}
