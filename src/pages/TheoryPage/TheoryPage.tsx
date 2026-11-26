import TheoryLab from '@/features/theory/TheoryLab/TheoryLab';

export default function TheoryPage() {
  return (
    <div className="overview">
      <div className="overview__heading">
        <span>Music Theory</span>

        <h1>Theory Laboratory</h1>

        <p>Explore scales, chords, harmony and the mathematical structure of music.</p>
      </div>

      <TheoryLab />
    </div>
  );
}
