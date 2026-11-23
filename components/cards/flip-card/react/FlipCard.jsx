export default function FlipCard() {
  return (
    <article className="fc-card" tabIndex={0} aria-label="Flip card: hover or focus to reveal details">
      <div className="fc-inner">
        <div className="fc-face fc-front">
          <h3>Front</h3>
          <p>Hover or focus me</p>
        </div>
        <div className="fc-face fc-back">
          <h3>Back</h3>
          <p>Hidden details live here.</p>
        </div>
      </div>
    </article>
  );
}
