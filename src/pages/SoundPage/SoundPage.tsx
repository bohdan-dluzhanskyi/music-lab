import SoundLab from '@/features/sound/SoundLab/SoundLab';

import PianoKeyboard from '@/features/sound/PianoKeyboard/PianoKeyboard';

export default function SoundPage() {
  return (
    <div className="overview">
      <div className="overview__heading">
        <span>Audio</span>

        <h1>Sound Laboratory</h1>

        <p>Explore sound synthesis, frequencies, harmonics and musical intervals.</p>
      </div>

      <SoundLab />

      <PianoKeyboard />
    </div>
  );
}
