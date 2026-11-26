import PianoRoll from '@/features/piano-roll/PianoRoll';
import NoteInspector from '@/features/piano-roll/NoteInspector';

import '../ComposerPage/ComposerPage.scss';

export default function PianoRollPage() {
  return (
    <section className="composer-page">
      <header className="composer-page__header">
        <h1>Piano Roll</h1>
      </header>

      <div className="composer-page__editor">
        <PianoRoll />
        <NoteInspector />
      </div>
    </section>
  );
}
